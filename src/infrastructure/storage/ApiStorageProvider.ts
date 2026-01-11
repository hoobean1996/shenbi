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
  stripeApi,
  GameType,
} from '../services/api';
import type {
  ProgressResponse,
  LevelResponse,
  AdventureResponse,
  LevelCreate,
} from '../services/api';
import type { CompactLevelData } from '../levels/types';

/**
 * Convert API progress to frontend LevelProgress format
 */
function convertApiProgressToLevelProgress(apiProgress: ProgressResponse): LevelProgress {
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
function convertApiLevelToCompactData(level: LevelResponse): CompactLevelData {
  return {
    id: level.slug,
    name: level.name,
    description: level.description || undefined,
    gameType: level.game_type as 'maze' | 'turtle' | undefined,
    grid: level.grid as unknown as string[] | undefined,
    availableCommands: level.available_commands as unknown as string[] | undefined,
    availableSensors: level.available_sensors as unknown as string[] | undefined,
    availableBlocks: level.available_blocks as unknown as string[] | undefined,
    teachingGoal: level.teaching_goal || undefined,
    hints: level.hints as unknown as string[] | undefined,
    // win_condition/fail_condition should be strings - don't double-stringify
    winCondition:
      typeof level.win_condition === 'string'
        ? level.win_condition
        : level.win_condition
          ? JSON.stringify(level.win_condition)
          : undefined,
    failCondition:
      typeof level.fail_condition === 'string'
        ? level.fail_condition
        : level.fail_condition
          ? JSON.stringify(level.fail_condition)
          : undefined,
    expectedCode: level.expected_code || undefined,
  };
}

/**
 * Convert CompactLevelData to API level create format
 */
function convertCompactDataToApiLevel(data: CompactLevelData, sortOrder: number): LevelCreate {
  return {
    slug: data.id || data.name.toLowerCase().replace(/\s+/g, '-'),
    name: data.name,
    description: data.description,
    game_type: data.gameType === 'maze' ? GameType.MAZE : GameType.TURTLE,
    grid: data.grid as unknown as Record<string, unknown>,
    available_commands: data.availableCommands,
    available_sensors: data.availableSensors,
    available_blocks: data.availableBlocks,
    teaching_goal: data.teachingGoal,
    hints: data.hints,
    win_condition: data.winCondition ? JSON.parse(data.winCondition) : undefined,
    fail_condition: data.failCondition ? JSON.parse(data.failCondition) : undefined,
    expected_code: data.expectedCode,
    sort_order: sortOrder,
  };
}

/**
 * Convert API adventure response to CustomAdventure
 */
function convertApiAdventureToCustom(
  adventure: AdventureResponse,
  levels: LevelResponse[]
): CustomAdventure {
  return {
    id: String(adventure.id),
    userId: String(adventure.app_id), // Use app_id as userId
    name: adventure.name,
    description: adventure.description || undefined,
    icon: adventure.icon || '📚',
    gameType: adventure.game_type as 'maze',
    levels: levels.map((l) => ({
      id: String(l.id),
      data: convertApiLevelToCompactData(l),
      createdAt: new Date(l.created_at).getTime(),
      updatedAt: new Date(l.created_at).getTime(), // SDK doesn't have updated_at
    })),
    createdAt: new Date(adventure.created_at).getTime(),
    updatedAt: new Date(adventure.created_at).getTime(),
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

    const [user, allProgress, settings, achievements, subscription] = await Promise.all([
      profileApi.get(),
      progressApi.getAll(),
      settingsApi.get(),
      achievementsApi.list(),
      stripeApi.getCurrentSubscription().catch(() => null),
    ]);

    // Convert progress to adventure-based structure
    const adventures: Record<string, AdventureProgress> = {};
    let totalStars = 0;
    let completedLevels = 0;

    for (const p of allProgress) {
      const adventureKey = String(p.adventure_id);
      const levelKey = String(p.level_id);
      if (!adventures[adventureKey]) {
        adventures[adventureKey] = {
          levels: {},
          currentLevelIndex: 0,
          startedAt: p.last_attempt_at ? new Date(p.last_attempt_at).getTime() : Date.now(),
        };
      }
      adventures[adventureKey].levels[levelKey] = convertApiProgressToLevelProgress(p);
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
        lastPlayedAdventure = String(p.adventure_id);
      }
    }

    // Determine subscription tier from subscription status
    const isPremium =
      subscription && (subscription.status === 'active' || subscription.status === 'trialing');

    this.userDataCache = {
      userId: String(user.id),
      profile: {
        name: user.display_name || 'Student',
        avatar: user.avatar_url || undefined,
        grade: user.grade || undefined,
        age: user.age || undefined,
        subscriptionTier: isPremium ? 'premium' : 'free',
        subscriptionStartedAt: subscription?.current_period_start
          ? new Date(subscription.current_period_start).getTime()
          : undefined,
        subscriptionExpiresAt: subscription?.current_period_end
          ? new Date(subscription.current_period_end).getTime()
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
        language: 'en', // SDK doesn't have language
        tourCompleted: (settings.tour_completed as unknown as Record<string, boolean>) || {},
      },
      achievements: achievements.map((a) => a.achievement_id),
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
      const progress = await progressApi.getByAdventure(parseInt(adventureId, 10));

      const levels: Record<string, LevelProgress> = {};
      for (const p of progress) {
        levels[String(p.level_id)] = convertApiProgressToLevelProgress(p);
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
    await progressApi.save({
      adventure_id: parseInt(adventureId, 10),
      level_id: parseInt(levelId, 10),
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
    code?: string,
    adventureNumericId?: number,
    levelNumericId?: number
  ): Promise<void> {
    // Use numeric IDs if provided, otherwise fall back to parsing string IDs
    const advId = adventureNumericId ?? parseInt(adventureId, 10);
    const lvlId = levelNumericId ?? parseInt(levelId, 10);

    if (isNaN(advId) || isNaN(lvlId)) {
      console.warn('Invalid adventure/level ID for progress save:', { adventureId, levelId });
      return;
    }

    await progressApi.save({
      adventure_id: advId,
      level_id: lvlId,
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

    const apiSettings = await settingsApi.get();

    this.settingsCache = {
      soundEnabled: apiSettings.sound_enabled,
      preferredTheme: apiSettings.preferred_theme || undefined,
      language: 'en',
      tourCompleted: (apiSettings.tour_completed as unknown as Record<string, boolean>) || {},
    };

    return this.settingsCache;
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    // Update sound/theme settings if provided
    if (settings.soundEnabled !== undefined || settings.preferredTheme !== undefined) {
      await settingsApi.update({
        sound_enabled: settings.soundEnabled,
        preferred_theme: settings.preferredTheme,
      });
    }

    // Handle tour completion separately using the dedicated API
    if (settings.tourCompleted) {
      const currentCache = this.settingsCache?.tourCompleted || {};
      for (const [tourId, completed] of Object.entries(settings.tourCompleted)) {
        // Only call API for newly completed tours
        if (completed && !currentCache[tourId]) {
          await settingsApi.completeTour(tourId);
        }
      }
    }

    // Invalidate cache
    this.settingsCache = null;
    this.userDataCache = null;
  }

  async getProfile(): Promise<UserProfile> {
    const [user, subscription] = await Promise.all([
      profileApi.get(),
      stripeApi.getCurrentSubscription().catch(() => null),
    ]);

    const isPremium =
      subscription && (subscription.status === 'active' || subscription.status === 'trialing');

    return {
      name: user.display_name || 'Student',
      avatar: user.avatar_url || undefined,
      grade: user.grade || undefined,
      age: user.age || undefined,
      role: user.role as UserProfile['role'],
      subscriptionTier: isPremium ? 'premium' : 'free',
      subscriptionStartedAt: subscription?.current_period_start
        ? new Date(subscription.current_period_start).getTime()
        : undefined,
      subscriptionExpiresAt: subscription?.current_period_end
        ? new Date(subscription.current_period_end).getTime()
        : undefined,
    };
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<void> {
    await profileApi.update({
      display_name: profile.name,
      avatar_url: profile.avatar,
      grade: profile.grade,
      age: profile.age,
    });

    // Invalidate cache
    this.userDataCache = null;
  }

  async getAchievements(): Promise<string[]> {
    const achievements = await achievementsApi.list();
    return achievements.map((a) => a.achievement_id);
  }

  async addAchievement(achievementId: string): Promise<void> {
    await achievementsApi.award({ achievement_id: achievementId });

    // Invalidate cache
    this.userDataCache = null;
  }

  // ============================================
  // Teacher Content Methods (using unified adventureApi)
  // ============================================

  async getTeacherContent(): Promise<TeacherContent> {
    // Returns ALL user-created adventures
    try {
      // Get all adventures
      const adventures = await adventureApi.list(false); // Include unpublished

      // Fetch full level data for each adventure
      const adventuresWithLevels = await Promise.all(
        adventures.map(async (adventure) => {
          const levels = await adventureApi.listLevels(adventure.id);
          return {
            id: String(adventure.id),
            userId: String(adventure.app_id),
            name: adventure.name,
            description: adventure.description || undefined,
            icon: adventure.icon || '📚',
            gameType: adventure.game_type as 'maze',
            levels: levels.map((l) => ({
              id: String(l.id),
              data: convertApiLevelToCompactData(l),
              createdAt: new Date(l.created_at).getTime(),
              updatedAt: new Date(l.created_at).getTime(),
            })),
            createdAt: new Date(adventure.created_at).getTime(),
            updatedAt: new Date(adventure.created_at).getTime(),
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
      await adventureApi.update(adventureId, {
        name: adventure.name,
        description: adventure.description,
        icon: adventure.icon,
        game_type: adventure.gameType === 'maze' ? GameType.MAZE : GameType.TURTLE,
      });

      // Delete existing levels and recreate them
      const existingLevels = await adventureApi.listLevels(adventureId);
      for (const level of existingLevels) {
        await adventureApi.deleteLevel(adventureId, level.id);
      }

      // Create new levels
      for (let i = 0; i < adventure.levels.length; i++) {
        await adventureApi.createLevel(
          adventureId,
          convertCompactDataToApiLevel(adventure.levels[i].data, i)
        );
      }

      // Fetch updated adventure
      const [updatedAdventure, levels] = await Promise.all([
        adventureApi.get(adventureId),
        adventureApi.listLevels(adventureId),
      ]);

      return convertApiAdventureToCustom(updatedAdventure, levels);
    } else {
      // Create new adventure
      const response = await adventureApi.create({
        slug: adventure.name.toLowerCase().replace(/\s+/g, '-'),
        name: adventure.name,
        description: adventure.description,
        icon: adventure.icon,
        game_type: adventure.gameType === 'maze' ? GameType.MAZE : GameType.TURTLE,
      });

      // Create levels
      for (let i = 0; i < adventure.levels.length; i++) {
        await adventureApi.createLevel(
          response.id,
          convertCompactDataToApiLevel(adventure.levels[i].data, i)
        );
      }

      // Fetch the full level data
      const levels = await adventureApi.listLevels(response.id);

      return convertApiAdventureToCustom(response, levels);
    }
  }

  async deleteCustomAdventure(adventureId: string): Promise<void> {
    const id = parseInt(adventureId, 10);
    if (!isNaN(id)) {
      await adventureApi.delete(id);
    }
  }

  async getCustomAdventure(adventureId: string): Promise<CustomAdventure | null> {
    const id = parseInt(adventureId, 10);
    if (isNaN(id)) {
      return null;
    }

    try {
      const [adventure, levels] = await Promise.all([
        adventureApi.get(id),
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
    const session = await sessionsApi.getBattle();
    if (!session) return null;

    return {
      roomCode: session.room_code,
      isHost: session.is_host,
      playerName: session.player_name || '',
      createdAt: new Date(session.created_at).getTime(),
    };
  }

  async saveBattleSession(session: BattleSession): Promise<void> {
    await sessionsApi.createBattle({
      room_code: session.roomCode,
      is_host: session.isHost,
      player_name: session.playerName,
    });
  }

  async clearBattleSession(): Promise<void> {
    await sessionsApi.endBattle();
  }

  async getClassroomSession(): Promise<ClassroomSession | null> {
    const session = await sessionsApi.getClassroom();
    if (!session) return null;

    return {
      classroomId: session.classroom_id,
      roomCode: session.room_code,
      role: session.role as 'teacher' | 'student',
      userName: '', // SDK doesn't have user_name
      createdAt: new Date(session.created_at).getTime(),
    };
  }

  async saveClassroomSession(session: ClassroomSession): Promise<void> {
    await sessionsApi.createClassroom({
      classroom_id: session.classroomId,
      room_code: session.roomCode,
      role: session.role,
    });
  }

  async clearClassroomSession(): Promise<void> {
    await sessionsApi.endClassroom();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.userDataCache = null;
    this.settingsCache = null;
  }
}
