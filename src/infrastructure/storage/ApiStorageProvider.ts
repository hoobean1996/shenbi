/**
 * API-based Storage Provider
 *
 * Implements StorageProvider interface using the backend API.
 * Uses device-based identification - no login required.
 */

import type { StorageProvider } from './StorageProvider';
import type {
  UserData,
  UserSettings,
  UserProfile,
  AdventureProgress,
  LevelProgress,
  TeacherContent,
  CustomAdventure,
  BattleSession,
  ClassroomSession,
} from './types';
import {
  profileApi,
  progressApi,
  settingsApi,
  achievementsApi,
  sessionsApi,
  adventureApi,
  ApiProgressResponse,
  ApiLevelResponse,
  ApiAdventureResponse,
  ApiLevelCreate,
  GameType,
} from '../services/api';
import type { CompactLevelData } from '../levels/types';

/**
 * Convert API progress to frontend LevelProgress format
 */
function convertApiProgressToLevelProgress(apiProgress: ApiProgressResponse): LevelProgress {
  return {
    completed: apiProgress.completed,
    starsCollected: apiProgress.stars,
    bestCode: apiProgress.best_code || undefined,
    attempts: apiProgress.attempts,
    completedAt: apiProgress.first_completed_at
      ? new Date(apiProgress.first_completed_at).getTime()
      : undefined,
  };
}

/**
 * Convert API level response to CompactLevelData
 */
function convertApiLevelToCompactData(level: ApiLevelResponse): CompactLevelData {
  return {
    id: level.slug,
    name: level.name,
    description: level.description || undefined,
    gameType: level.game_type as 'maze' | 'turtle' | undefined,
    grid: level.grid || undefined,
    availableCommands: level.available_commands || undefined,
    availableSensors: level.available_sensors || undefined,
    availableBlocks: level.available_blocks || undefined,
    teachingGoal: level.teaching_goal || undefined,
    hints: level.hints || undefined,
    winCondition: level.win_condition || undefined,
    failCondition: level.fail_condition || undefined,
    expectedCode: level.expected_code || undefined,
  };
}

/**
 * Convert CompactLevelData to API level create format
 */
function convertCompactDataToApiLevel(data: CompactLevelData, sortOrder: number): ApiLevelCreate {
  return {
    name: data.name,
    description: data.description,
    game_type: data.gameType as GameType | undefined,
    grid: data.grid,
    available_commands: data.availableCommands,
    available_sensors: data.availableSensors,
    available_blocks: data.availableBlocks,
    teaching_goal: data.teachingGoal,
    hints: data.hints,
    win_condition: data.winCondition,
    fail_condition: data.failCondition,
    expected_code: data.expectedCode,
    sort_order: sortOrder,
  };
}

/**
 * Convert API adventure response to CustomAdventure
 */
function convertApiAdventureToCustom(
  adventure: ApiAdventureResponse,
  levels: ApiLevelResponse[]
): CustomAdventure {
  return {
    id: String(adventure.id),
    userId: String(adventure.user_id),
    name: adventure.name,
    description: adventure.description || undefined,
    icon: adventure.icon || '📚',
    gameType: adventure.game_type as 'maze',
    levels: levels.map((l) => ({
      id: String(l.id),
      data: convertApiLevelToCompactData(l),
      createdAt: new Date(l.created_at).getTime(),
      updatedAt: new Date(l.updated_at).getTime(),
    })),
    createdAt: new Date(adventure.created_at).getTime(),
    updatedAt: new Date(adventure.updated_at).getTime(),
  };
}

/**
 * API-based Storage Provider
 */
export class ApiStorageProvider implements StorageProvider {
  private userDataCache: UserData | null = null;
  private settingsCache: UserSettings | null = null;

  /**
   * Get full user data (combines multiple API calls)
   */
  async getUserData(): Promise<UserData> {
    if (this.userDataCache) {
      return this.userDataCache;
    }

    const [user, allProgress, settings, achievements] = await Promise.all([
      profileApi.getProfile(),
      progressApi.getAllProgress(),
      settingsApi.getSettings(),
      achievementsApi.getAchievements(),
    ]);

    // Convert progress to adventure-based structure
    const adventures: Record<string, AdventureProgress> = {};
    let totalStars = 0;
    let completedLevels = 0;

    for (const p of allProgress) {
      if (!adventures[p.adventure_id]) {
        adventures[p.adventure_id] = {
          levels: {},
          currentLevelIndex: 0,
          startedAt: p.last_attempt_at ? new Date(p.last_attempt_at).getTime() : Date.now(),
        };
      }
      adventures[p.adventure_id].levels[p.level_id] = convertApiProgressToLevelProgress(p);
      totalStars += p.stars;
      if (p.completed) completedLevels++;
    }

    // Find last played adventure
    let lastPlayedAdventure: string | undefined;
    let lastPlayedAt: number | undefined;
    for (const p of allProgress) {
      if (!p.last_attempt_at) continue;
      const attemptTime = new Date(p.last_attempt_at).getTime();
      if (!lastPlayedAt || attemptTime > lastPlayedAt) {
        lastPlayedAt = attemptTime;
        lastPlayedAdventure = p.adventure_id;
      }
    }

    this.userDataCache = {
      userId: String(user.id),
      profile: {
        name: user.display_name || 'Student',
        avatar: user.avatar_url || undefined,
        grade: user.grade || undefined,
        age: user.age || undefined,
        subscriptionTier: user.subscription_tier,
        subscriptionStartedAt: user.subscription_started_at
          ? new Date(user.subscription_started_at).getTime()
          : undefined,
        subscriptionExpiresAt: user.subscription_expires_at
          ? new Date(user.subscription_expires_at).getTime()
          : undefined,
      },
      progress: {
        adventures,
        totalStars,
        completedLevels,
        lastPlayedAdventure,
        lastPlayedAt,
      },
      settings: {
        soundEnabled: settings.sound_enabled,
        preferredTheme: settings.preferred_theme || undefined,
        language: settings.language,
        tourCompleted: settings.tour_completed,
      },
      achievements: achievements.achievements,
      createdAt: new Date(user.created_at).getTime(),
    };

    return this.userDataCache;
  }

  async saveUserData(data: UserData): Promise<void> {
    // This is a no-op for API - individual save methods are used
    this.userDataCache = data;
  }

  async getAdventureProgress(adventureId: string): Promise<AdventureProgress | null> {
    try {
      const apiProgress = await progressApi.getAdventureProgress(adventureId);

      const levels: Record<string, LevelProgress> = {};
      for (const p of apiProgress.levels) {
        levels[p.level_id] = convertApiProgressToLevelProgress(p);
      }

      return {
        levels,
        currentLevelIndex: 0, // Not tracked in API yet
        startedAt: Date.now(),
      };
    } catch {
      return null;
    }
  }

  async saveLevelProgress(
    adventureId: string,
    levelId: string,
    progress: LevelProgress
  ): Promise<void> {
    await progressApi.saveProgress({
      adventure_id: adventureId,
      level_id: levelId,
      stars: progress.starsCollected,
      completed: progress.completed,
      code: progress.bestCode,
    });

    // Invalidate cache
    this.userDataCache = null;
  }

  async markLevelComplete(
    adventureId: string,
    levelId: string,
    starsCollected: number,
    code?: string
  ): Promise<void> {
    await progressApi.saveProgress({
      adventure_id: adventureId,
      level_id: levelId,
      stars: starsCollected,
      completed: true,
      code,
    });

    // Invalidate cache
    this.userDataCache = null;
  }

  async updateCurrentLevel(_adventureId: string, _levelIndex: number): Promise<void> {
    // Not tracked in API - could add later
    // For now, just invalidate cache
    this.userDataCache = null;
  }

  async getSettings(): Promise<UserSettings> {
    if (this.settingsCache) {
      return this.settingsCache;
    }

    const apiSettings = await settingsApi.getSettings();

    this.settingsCache = {
      soundEnabled: apiSettings.sound_enabled,
      preferredTheme: apiSettings.preferred_theme || undefined,
      language: apiSettings.language,
      tourCompleted: apiSettings.tour_completed,
    };

    return this.settingsCache;
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    await settingsApi.updateSettings({
      sound_enabled: settings.soundEnabled,
      preferred_theme: settings.preferredTheme,
      language: settings.language,
      tour_completed: settings.tourCompleted,
    });

    // Invalidate cache
    this.settingsCache = null;
    this.userDataCache = null;
  }

  async getProfile(): Promise<UserProfile> {
    const user = await profileApi.getProfile();

    return {
      name: user.display_name || 'Student',
      avatar: user.avatar_url || undefined,
      grade: user.grade || undefined,
      age: user.age || undefined,
      role: user.role as UserProfile['role'],
      subscriptionTier: user.subscription_tier,
      subscriptionStartedAt: user.subscription_started_at
        ? new Date(user.subscription_started_at).getTime()
        : undefined,
      subscriptionExpiresAt: user.subscription_expires_at
        ? new Date(user.subscription_expires_at).getTime()
        : undefined,
    };
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<void> {
    await profileApi.updateProfile({
      display_name: profile.name,
      avatar_url: profile.avatar,
      grade: profile.grade,
      age: profile.age,
      role: profile.role,
    });

    // Invalidate cache
    this.userDataCache = null;
  }

  async getAchievements(): Promise<string[]> {
    const result = await achievementsApi.getAchievements();
    return result.achievements;
  }

  async addAchievement(achievementId: string): Promise<void> {
    await achievementsApi.addAchievement(achievementId);

    // Invalidate cache
    this.userDataCache = null;
  }

  // ============================================
  // Teacher Content Methods (using unified adventureApi)
  // ============================================

  async getTeacherContent(): Promise<TeacherContent> {
    // Returns ALL user-created adventures (user_id > 0) with levels
    try {
      // Get all adventures
      const response = await adventureApi.listAdventures();

      // Filter to only user-created adventures (user_id > 0)
      const userAdventures = response.adventures.filter((a) => a.user_id > 0);

      // Fetch full level data for each adventure
      const adventuresWithLevels = await Promise.all(
        userAdventures.map(async (adventure) => {
          const levels = await adventureApi.listLevels(adventure.id);
          return {
            id: String(adventure.id),
            userId: String(adventure.user_id),
            name: adventure.name,
            description: adventure.description || undefined,
            icon: adventure.icon || '📚',
            gameType: adventure.game_type as 'maze',
            levels: levels.map((l) => ({
              id: String(l.id),
              data: convertApiLevelToCompactData(l),
              createdAt: new Date(l.created_at).getTime(),
              updatedAt: new Date(l.updated_at).getTime(),
            })),
            createdAt: Date.now(), // Brief response doesn't have timestamps
            updatedAt: Date.now(),
          };
        })
      );

      return {
        adventures: adventuresWithLevels,
      };
    } catch {
      return { adventures: [] };
    }
  }

  async saveCustomAdventure(adventure: CustomAdventure): Promise<CustomAdventure> {
    const adventureId = parseInt(adventure.id, 10);

    // Check if adventure exists (id is a number) or is new (id is a string like "new-xxx")
    if (!isNaN(adventureId)) {
      // Update existing adventure metadata
      await adventureApi.updateAdventure(adventureId, {
        name: adventure.name,
        description: adventure.description,
        icon: adventure.icon,
        game_type: adventure.gameType as GameType,
      });

      // Replace all levels
      const response = await adventureApi.replaceAllLevels(
        adventureId,
        adventure.levels.map((l, i) => convertCompactDataToApiLevel(l.data, i))
      );

      // Fetch the full level data
      const levels = await adventureApi.listLevels(adventureId);

      return convertApiAdventureToCustom(response, levels);
    } else {
      // Create new adventure with levels
      const response = await adventureApi.createAdventure({
        name: adventure.name,
        description: adventure.description,
        icon: adventure.icon,
        game_type: adventure.gameType as GameType,
        levels: adventure.levels.map((l, i) => convertCompactDataToApiLevel(l.data, i)),
      });

      // Fetch the full level data
      const levels = await adventureApi.listLevels(response.id);

      return convertApiAdventureToCustom(response, levels);
    }
  }

  async deleteCustomAdventure(adventureId: string): Promise<void> {
    const id = parseInt(adventureId, 10);
    if (!isNaN(id)) {
      await adventureApi.deleteAdventure(id);
    }
  }

  async getCustomAdventure(adventureId: string): Promise<CustomAdventure | null> {
    const id = parseInt(adventureId, 10);
    if (isNaN(id)) {
      return null;
    }

    try {
      const [adventure, levels] = await Promise.all([
        adventureApi.getAdventure(id),
        adventureApi.listLevels(id),
      ]);
      return convertApiAdventureToCustom(adventure, levels);
    } catch {
      return null;
    }
  }

  // ============================================
  // Session Methods (Battle & Classroom)
  // ============================================

  async getBattleSession(): Promise<BattleSession | null> {
    const session = await sessionsApi.getBattleSession();
    if (!session) return null;

    return {
      roomCode: session.room_code,
      isHost: session.is_host,
      playerName: session.player_name,
      createdAt: new Date(session.created_at).getTime(),
    };
  }

  async saveBattleSession(session: BattleSession): Promise<void> {
    await sessionsApi.saveBattleSession({
      room_code: session.roomCode,
      is_host: session.isHost,
      player_name: session.playerName,
    });
  }

  async clearBattleSession(): Promise<void> {
    await sessionsApi.clearBattleSession();
  }

  async getClassroomSession(): Promise<ClassroomSession | null> {
    const session = await sessionsApi.getClassroomSession();
    if (!session || !session.classroom_id) return null;

    return {
      classroomId: session.classroom_id,
      roomCode: session.room_code,
      role: session.role,
      userName: session.user_name,
      createdAt: new Date(session.created_at).getTime(),
    };
  }

  async saveClassroomSession(session: ClassroomSession): Promise<void> {
    await sessionsApi.saveClassroomSession({
      classroom_id: session.classroomId,
      room_code: session.roomCode,
      role: session.role,
      user_name: session.userName,
    });
  }

  async clearClassroomSession(): Promise<void> {
    await sessionsApi.clearClassroomSession();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.userDataCache = null;
    this.settingsCache = null;
  }
}
