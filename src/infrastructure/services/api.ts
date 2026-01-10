/**
 * API Client for Shenbi Backend
 * Uses @lemonade/sdk for all API calls.
 */

import { getLemonClient } from '../../features/shared/contexts/AuthContext';
import {
  GameType as SdkGameType,
  AssignmentStatus as SdkAssignmentStatus,
} from '@lemonade/sdk';
import type {
  AdventureListResponse,
  AdventureResponse,
  LevelResponse,
  ProgressResponse,
  AchievementResponse,
  ProfileResponse,
  SettingsResponse,
  BattleSessionResponse,
  ClassroomSessionResponse,
  ClassroomResponse,
  AssignmentResponse,
  GradebookEntry,
  MemberResponse as SdkMemberResponse,
  SubmissionResponse as SdkSubmissionResponse,
  StatsResponse as SdkStatsResponse,
} from '@lemonade/sdk';

// Re-export AssignmentStatus for backward compatibility
export const AssignmentStatus = SdkAssignmentStatus;
export type AssignmentStatus = SdkAssignmentStatus;

/**
 * API response types matching frontend expectations
 */

export type GameType = 'maze' | 'turtle';

// Standard library function types
export interface StdlibFunctionParam {
  name: string;
  nameZh: string;
  type: 'number' | 'string' | 'boolean' | 'any';
}

export interface StdlibFunction {
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  params?: StdlibFunctionParam[];
  returns?: 'number' | 'string' | 'boolean' | 'void' | 'any';
  category: 'movement' | 'action' | 'sensor' | 'helper' | 'constant';
  code: string;
}

export interface ApiAdventureBrief {
  id: number;
  slug: string;
  name: string;
  name_zh: string | null;
  description: string | null;
  description_zh: string | null;
  icon: string | null;
  game_type: GameType;
  complexity: string | null;
  age_range: string | null;
  level_count: number;
  user_id: number;
}

export interface ApiAdventureListResponse {
  adventures: ApiAdventureBrief[];
  total: number;
}

export interface ApiLevelBrief {
  id: number;
  slug: string;
  name: string;
  name_zh: string | null;
  description: string | null;
  description_zh: string | null;
  sort_order: number;
  required_tier: string;
}

export interface ApiAdventureResponse {
  id: number;
  slug: string;
  name: string;
  name_zh: string | null;
  description: string | null;
  description_zh: string | null;
  long_description: string | null;
  long_description_zh: string | null;
  icon: string | null;
  game_type: GameType;
  theme_id: string | null;
  complexity: string | null;
  age_range: string | null;
  tags: string[] | null;
  concepts: string[] | null;
  stdlib_functions: StdlibFunction[] | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  levels: ApiLevelBrief[];
  user_id: number;
}

export interface ApiLevelResponse {
  id: number;
  adventure_id: number;
  slug: string;
  name: string;
  name_zh: string | null;
  description: string | null;
  description_zh: string | null;
  game_type: GameType;
  grid: string[] | null;
  available_commands: string[] | null;
  available_sensors: string[] | null;
  available_blocks: string[] | null;
  win_condition: string | null;
  fail_condition: string | null;
  teaching_goal: string | null;
  teaching_goal_zh: string | null;
  hints: string[] | null;
  hints_zh: string[] | null;
  expected_code: string | null;
  sort_order: number;
  is_published: boolean;
  required_tier: string;
  created_at: string;
  updated_at: string;
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Helper to wrap SDK calls with error handling
 */
async function wrapSdkCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error) {
      const e = error as { status: number; message?: string; body?: { detail?: string } };
      throw new ApiError(
        e.message || 'API request failed',
        e.status,
        e.body?.detail
      );
    }
    throw error;
  }
}

/**
 * Convert local GameType to SDK GameType enum
 */
function toSdkGameType(gameType: GameType | undefined): SdkGameType | undefined {
  if (!gameType) return undefined;
  return gameType === 'maze' ? SdkGameType.MAZE : SdkGameType.TURTLE;
}

/**
 * Convert local AssignmentStatusType to SDK AssignmentStatus enum
 */
function toSdkAssignmentStatus(status: AssignmentStatusType | undefined): SdkAssignmentStatus | undefined {
  if (!status) return undefined;
  switch (status) {
    case 'draft': return SdkAssignmentStatus.DRAFT;
    case 'published': return SdkAssignmentStatus.PUBLISHED;
    case 'closed': return SdkAssignmentStatus.CLOSED;
    default: return undefined;
  }
}

/**
 * Map SDK AdventureListResponse to frontend type
 */
function mapAdventureBrief(adv: AdventureListResponse): ApiAdventureBrief {
  return {
    id: adv.id,
    slug: adv.slug,
    name: adv.name,
    name_zh: null,
    description: adv.description,
    description_zh: null,
    icon: adv.icon,
    game_type: adv.game_type as GameType,
    complexity: adv.complexity?.toString() ?? null,
    age_range: adv.age_range,
    level_count: 0, // Will be populated when getting full adventure
    user_id: 0, // System adventures
  };
}

/**
 * Map SDK AdventureResponse to frontend type
 */
function mapAdventureResponse(adv: AdventureResponse): ApiAdventureResponse {
  return {
    id: adv.id,
    slug: adv.slug,
    name: adv.name,
    name_zh: null,
    description: adv.description,
    description_zh: null,
    long_description: null,
    long_description_zh: null,
    icon: adv.icon,
    game_type: adv.game_type as GameType,
    theme_id: null,
    complexity: adv.complexity?.toString() ?? null,
    age_range: adv.age_range,
    tags: adv.tags as string[] | null,
    concepts: adv.concepts as string[] | null,
    stdlib_functions: adv.stdlib_functions as StdlibFunction[] | null,
    sort_order: adv.sort_order,
    is_published: adv.is_published,
    created_at: adv.created_at,
    updated_at: adv.created_at,
    levels: (adv.levels || []).map((lvl) => ({
      id: lvl.id,
      slug: lvl.slug,
      name: lvl.name,
      name_zh: null,
      description: lvl.description,
      description_zh: null,
      sort_order: lvl.sort_order,
      required_tier: lvl.required_tier,
    })),
    user_id: 0,
  };
}

/**
 * Map SDK LevelResponse to frontend type
 */
function mapLevelResponse(lvl: LevelResponse): ApiLevelResponse {
  return {
    id: lvl.id,
    adventure_id: lvl.adventure_id,
    slug: lvl.slug,
    name: lvl.name,
    name_zh: null,
    description: lvl.description,
    description_zh: null,
    game_type: lvl.game_type as GameType,
    grid: lvl.grid as string[] | null,
    available_commands: lvl.available_commands as string[] | null,
    available_sensors: lvl.available_sensors as string[] | null,
    available_blocks: lvl.available_blocks as string[] | null,
    win_condition: lvl.win_condition ? JSON.stringify(lvl.win_condition) : null,
    fail_condition: lvl.fail_condition ? JSON.stringify(lvl.fail_condition) : null,
    teaching_goal: lvl.teaching_goal,
    teaching_goal_zh: null,
    hints: lvl.hints as string[] | null,
    hints_zh: null,
    expected_code: lvl.expected_code,
    sort_order: lvl.sort_order,
    is_published: true,
    required_tier: lvl.required_tier,
    created_at: lvl.created_at,
    updated_at: lvl.created_at,
  };
}

/**
 * Level create/update data
 */
export interface ApiLevelCreate {
  name: string;
  name_zh?: string | null;
  description?: string | null;
  description_zh?: string | null;
  game_type?: GameType | null;
  grid?: string[] | null;
  available_commands?: string[] | null;
  available_sensors?: string[] | null;
  available_blocks?: string[] | null;
  win_condition?: string | null;
  fail_condition?: string | null;
  teaching_goal?: string | null;
  teaching_goal_zh?: string | null;
  hints?: string[] | null;
  hints_zh?: string[] | null;
  expected_code?: string | null;
  sort_order?: number | null;
  required_tier?: string;
}

/**
 * Adventure create data
 */
export interface ApiAdventureCreate {
  name: string;
  name_zh?: string | null;
  description?: string | null;
  description_zh?: string | null;
  icon?: string | null;
  game_type?: GameType;
  levels?: ApiLevelCreate[];
}

/**
 * Adventure update data
 */
export interface ApiAdventureUpdate {
  name?: string | null;
  name_zh?: string | null;
  description?: string | null;
  description_zh?: string | null;
  icon?: string | null;
  game_type?: GameType | null;
}

/**
 * Adventure API endpoints
 */
export const adventureApi = {
  async listAdventures(options?: {
    gameType?: GameType;
    userId?: number;
    publishedOnly?: boolean;
  }): Promise<ApiAdventureListResponse> {
    const client = getLemonClient();
    const adventures = await wrapSdkCall(() =>
      client.shenbiAdventures.list(options?.publishedOnly ?? true, options?.gameType)
    );
    return {
      adventures: adventures.map(mapAdventureBrief),
      total: adventures.length,
    };
  },

  async getAdventure(adventureId: number): Promise<ApiAdventureResponse> {
    const client = getLemonClient();
    const adventure = await wrapSdkCall(() => client.shenbiAdventures.get(adventureId));
    return mapAdventureResponse(adventure);
  },

  async createAdventure(data: ApiAdventureCreate): Promise<ApiAdventureResponse> {
    const client = getLemonClient();
    const adventure = await wrapSdkCall(() =>
      client.shenbiAdventures.create({
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
        name: data.name,
        description: data.description,
        icon: data.icon,
        game_type: toSdkGameType(data.game_type),
      })
    );
    return mapAdventureResponse(adventure);
  },

  async updateAdventure(
    adventureId: number,
    data: ApiAdventureUpdate
  ): Promise<ApiAdventureResponse> {
    const client = getLemonClient();
    const adventure = await wrapSdkCall(() =>
      client.shenbiAdventures.update(adventureId, {
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        icon: data.icon ?? undefined,
        game_type: data.game_type ? toSdkGameType(data.game_type) : undefined,
      })
    );
    return mapAdventureResponse(adventure);
  },

  async deleteAdventure(adventureId: number): Promise<void> {
    const client = getLemonClient();
    await wrapSdkCall(() => client.shenbiAdventures.delete(adventureId));
  },

  async listLevels(
    adventureId: number,
    _options?: { publishedOnly?: boolean }
  ): Promise<ApiLevelResponse[]> {
    const client = getLemonClient();
    const levels = await wrapSdkCall(() => client.shenbiAdventures.listLevels(adventureId));
    return levels.map(mapLevelResponse);
  },

  async getLevel(adventureId: number, levelId: number): Promise<ApiLevelResponse> {
    const client = getLemonClient();
    // Get adventure with levels and find the specific level
    const adventure = await wrapSdkCall(() => client.shenbiAdventures.get(adventureId));
    const level = adventure.levels?.find((l) => l.id === levelId);
    if (!level) {
      throw new ApiError('Level not found', 404);
    }
    // Get full level details
    const levels = await wrapSdkCall(() => client.shenbiAdventures.listLevels(adventureId));
    const fullLevel = levels.find((l) => l.id === levelId);
    if (!fullLevel) {
      throw new ApiError('Level not found', 404);
    }
    return mapLevelResponse(fullLevel);
  },

  async getLevelByIndex(adventureId: number, index: number): Promise<ApiLevelResponse> {
    const client = getLemonClient();
    const levels = await wrapSdkCall(() => client.shenbiAdventures.listLevels(adventureId));
    const level = levels[index];
    if (!level) {
      throw new ApiError('Level not found', 404);
    }
    return mapLevelResponse(level);
  },

  async createLevel(adventureId: number, data: ApiLevelCreate): Promise<ApiLevelResponse> {
    const client = getLemonClient();
    const level = await wrapSdkCall(() =>
      client.shenbiAdventures.createLevel(adventureId, {
        slug: data.name.toLowerCase().replace(/\s+/g, '-'),
        name: data.name,
        description: data.description,
        game_type: toSdkGameType(data.game_type ?? undefined),
        grid: data.grid as (Record<string, unknown> | unknown[]) | undefined,
        available_commands: data.available_commands ?? undefined,
        available_sensors: data.available_sensors ?? undefined,
        available_blocks: data.available_blocks ?? undefined,
        win_condition: data.win_condition ? JSON.parse(data.win_condition) : undefined,
        fail_condition: data.fail_condition ? JSON.parse(data.fail_condition) : undefined,
        teaching_goal: data.teaching_goal ?? undefined,
        hints: data.hints ?? undefined,
        expected_code: data.expected_code ?? undefined,
        required_tier: data.required_tier ?? 'free',
        sort_order: data.sort_order ?? 0,
      })
    );
    return mapLevelResponse(level);
  },

  async updateLevel(
    adventureId: number,
    levelId: number,
    data: Partial<ApiLevelCreate>
  ): Promise<ApiLevelResponse> {
    const client = getLemonClient();
    const level = await wrapSdkCall(() =>
      client.shenbiAdventures.updateLevel(adventureId, levelId, {
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        game_type: data.game_type ? toSdkGameType(data.game_type) : undefined,
        grid: data.grid as (Record<string, unknown> | unknown[]) | undefined,
        available_commands: data.available_commands ?? undefined,
        available_sensors: data.available_sensors ?? undefined,
        available_blocks: data.available_blocks ?? undefined,
        win_condition: data.win_condition ? JSON.parse(data.win_condition) : undefined,
        fail_condition: data.fail_condition ? JSON.parse(data.fail_condition) : undefined,
        teaching_goal: data.teaching_goal ?? undefined,
        hints: data.hints ?? undefined,
        expected_code: data.expected_code ?? undefined,
        required_tier: data.required_tier ?? undefined,
        sort_order: data.sort_order ?? undefined,
      })
    );
    return mapLevelResponse(level);
  },

  async deleteLevel(adventureId: number, levelId: number): Promise<void> {
    const client = getLemonClient();
    await wrapSdkCall(() => client.shenbiAdventures.deleteLevel(adventureId, levelId));
  },

  async replaceAllLevels(
    _adventureId: number,
    _levels: ApiLevelCreate[]
  ): Promise<ApiAdventureResponse> {
    // This would require a bulk update endpoint - for now, throw not implemented
    throw new ApiError('Bulk level replacement not implemented', 501);
  },
};

// ============================================
// Profile API Types
// ============================================

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export interface ApiUserResponse {
  id: number;
  device_id: string;
  display_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  grade: string | null;
  age: number | null;
  subscription_tier: string;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
  created_at: string;
}

export interface ApiUserStatsResponse {
  total_stars: number;
  completed_levels: number;
  total_attempts: number;
  achievements_count: number;
  last_played_at: string | null;
}

function mapProfileResponse(profile: ProfileResponse): ApiUserResponse {
  return {
    id: profile.id,
    device_id: '',
    display_name: profile.display_name,
    role: profile.role as UserRole,
    avatar_url: profile.avatar_url,
    grade: profile.grade,
    age: profile.age,
    subscription_tier: 'free',
    subscription_started_at: null,
    subscription_expires_at: null,
    created_at: profile.created_at,
  };
}

/**
 * Profile API endpoints
 */
export const profileApi = {
  async getProfile(): Promise<ApiUserResponse> {
    const client = getLemonClient();
    const profile = await wrapSdkCall(() => client.shenbiProfile.get());
    return mapProfileResponse(profile);
  },

  async updateProfile(data: {
    display_name?: string;
    avatar_url?: string;
    grade?: string;
    age?: number;
    role?: UserRole;
  }): Promise<ApiUserResponse> {
    const client = getLemonClient();
    // Note: role is not updatable via SDK - stored in profile on backend
    const profile = await wrapSdkCall(() =>
      client.shenbiProfile.update({
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        grade: data.grade,
        age: data.age,
      })
    );
    return mapProfileResponse(profile);
  },

  async getStats(): Promise<ApiUserStatsResponse> {
    const client = getLemonClient();
    const stats = await wrapSdkCall(() => client.shenbiProfile.getStats());
    return {
      total_stars: stats.total_stars ?? 0,
      completed_levels: stats.completed_levels ?? 0,
      total_attempts: stats.total_attempts ?? 0,
      achievements_count: stats.achievements_count ?? 0,
      last_played_at: null, // Not available in SDK
    };
  },

  async upgradeToPremium(): Promise<ApiUserResponse> {
    // This would go through Stripe - for now return current profile
    throw new ApiError('Premium upgrade requires Stripe integration', 501);
  },
};

// ============================================
// Stripe API (placeholder - needs backend integration)
// ============================================

export interface StripeCheckoutResponse {
  checkout_url: string;
}

export interface StripeVerifyResponse {
  success: boolean;
  subscription_tier: string;
}

export const stripeApi = {
  async createCheckoutSession(): Promise<StripeCheckoutResponse> {
    throw new ApiError('Stripe integration not implemented', 501);
  },

  async verifyCheckout(_sessionId: string): Promise<StripeVerifyResponse> {
    throw new ApiError('Stripe integration not implemented', 501);
  },

  async resetToFree(): Promise<StripeVerifyResponse> {
    throw new ApiError('Stripe integration not implemented', 501);
  },
};

// ============================================
// Progress API Types
// ============================================

export interface ApiProgressResponse {
  id: number;
  user_id: number;
  adventure_id: string;
  level_id: string;
  stars: number;
  completed: boolean;
  attempts: number;
  best_code: string | null;
  first_completed_at: string | null;
  last_attempt_at: string | null;
}

export interface ApiAdventureProgressResponse {
  adventure_id: string;
  total_levels: number;
  completed_levels: number;
  total_stars: number;
  levels: ApiProgressResponse[];
}

function mapProgressResponse(progress: ProgressResponse): ApiProgressResponse {
  return {
    id: progress.id,
    user_id: progress.user_id,
    adventure_id: String(progress.adventure_id),
    level_id: String(progress.level_id),
    stars: progress.stars,
    completed: progress.completed,
    attempts: progress.attempts,
    best_code: progress.best_code,
    first_completed_at: progress.first_completed_at,
    last_attempt_at: progress.last_attempt_at,
  };
}

/**
 * Progress API endpoints
 */
export const progressApi = {
  async getAllProgress(): Promise<ApiProgressResponse[]> {
    const client = getLemonClient();
    const progress = await wrapSdkCall(() => client.shenbiProgress.getAll());
    return progress.map(mapProgressResponse);
  },

  async getAdventureProgress(adventureId: string): Promise<ApiAdventureProgressResponse> {
    const client = getLemonClient();
    const progress = await wrapSdkCall(() =>
      client.shenbiProgress.getByAdventure(parseInt(adventureId, 10))
    );
    const levels = progress.map(mapProgressResponse);
    return {
      adventure_id: adventureId,
      total_levels: levels.length,
      completed_levels: levels.filter((l) => l.completed).length,
      total_stars: levels.reduce((sum, l) => sum + l.stars, 0),
      levels,
    };
  },

  async getLevelProgress(
    adventureId: string,
    levelId: string
  ): Promise<ApiProgressResponse | null> {
    const client = getLemonClient();
    const progress = await wrapSdkCall(() =>
      client.shenbiProgress.getByLevel(parseInt(adventureId, 10), parseInt(levelId, 10))
    );
    return progress ? mapProgressResponse(progress) : null;
  },

  async saveProgress(data: {
    adventure_id: string;
    level_id: string;
    stars: number;
    completed: boolean;
    code?: string;
  }): Promise<ApiProgressResponse> {
    const client = getLemonClient();
    const progress = await wrapSdkCall(() =>
      client.shenbiProgress.save({
        adventure_id: parseInt(data.adventure_id, 10),
        level_id: parseInt(data.level_id, 10),
        stars: data.stars,
        completed: data.completed,
        code: data.code,
      })
    );
    return mapProgressResponse(progress);
  },
};

// ============================================
// Settings API Types
// ============================================

export interface ApiSettingsResponse {
  id: number;
  user_id: number;
  sound_enabled: boolean;
  preferred_theme: string | null;
  language: string;
  tour_completed: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

function mapSettingsResponse(settings: SettingsResponse): ApiSettingsResponse {
  return {
    id: settings.id,
    user_id: settings.user_id,
    sound_enabled: settings.sound_enabled,
    preferred_theme: settings.preferred_theme,
    language: 'en',
    tour_completed: settings.tour_completed
      ? (settings.tour_completed as Record<string, boolean>)
      : {},
    created_at: settings.created_at,
    updated_at: settings.created_at,
  };
}

/**
 * Settings API endpoints
 */
export const settingsApi = {
  async getSettings(): Promise<ApiSettingsResponse> {
    const client = getLemonClient();
    const settings = await wrapSdkCall(() => client.shenbiSettings.get());
    return mapSettingsResponse(settings);
  },

  async updateSettings(data: {
    sound_enabled?: boolean;
    preferred_theme?: string | null;
    language?: string;
    tour_completed?: Record<string, boolean>;
  }): Promise<ApiSettingsResponse> {
    const client = getLemonClient();
    const settings = await wrapSdkCall(() =>
      client.shenbiSettings.update({
        sound_enabled: data.sound_enabled,
        preferred_theme: data.preferred_theme,
      })
    );
    return mapSettingsResponse(settings);
  },

  async markTourCompleted(tourId: string): Promise<ApiSettingsResponse> {
    const client = getLemonClient();
    const settings = await wrapSdkCall(() => client.shenbiSettings.completeTour(tourId));
    return mapSettingsResponse(settings);
  },
};

// ============================================
// Achievements API Types
// ============================================

export interface ApiAchievementResponse {
  id: number;
  user_id: number;
  achievement_id: string;
  earned_at: string;
}

export interface ApiAchievementListResponse {
  achievements: string[];
  total: number;
}

function mapAchievementResponse(ach: AchievementResponse): ApiAchievementResponse {
  return {
    id: ach.id,
    user_id: ach.user_id,
    achievement_id: ach.achievement_id,
    earned_at: ach.earned_at,
  };
}

/**
 * Achievements API endpoints
 */
export const achievementsApi = {
  async getAchievements(): Promise<ApiAchievementListResponse> {
    const client = getLemonClient();
    const achievements = await wrapSdkCall(() => client.shenbiAchievements.list());
    return {
      achievements: achievements.map((a) => a.achievement_id),
      total: achievements.length,
    };
  },

  async getAchievementsDetails(): Promise<ApiAchievementResponse[]> {
    const client = getLemonClient();
    const achievements = await wrapSdkCall(() => client.shenbiAchievements.list());
    return achievements.map(mapAchievementResponse);
  },

  async addAchievement(achievementId: string): Promise<ApiAchievementResponse> {
    const client = getLemonClient();
    const achievement = await wrapSdkCall(() =>
      client.shenbiAchievements.award({ achievement_id: achievementId })
    );
    return mapAchievementResponse(achievement);
  },

  async hasAchievement(achievementId: string): Promise<boolean> {
    const client = getLemonClient();
    const result = await wrapSdkCall(() => client.shenbiAchievements.check(achievementId));
    return result?.has_achievement ?? false;
  },
};

// ============================================
// Sessions API Types
// ============================================

export type SessionStatus = 'active' | 'ended' | 'expired';

export interface ApiBattleSessionResponse {
  id: number;
  user_id: number;
  room_code: string;
  is_host: boolean;
  player_name: string;
  status: SessionStatus;
  created_at: string;
  expires_at: string;
  ended_at: string | null;
}

export interface ApiClassroomSessionResponse {
  id: number;
  user_id: number;
  classroom_id: number | null;
  room_code: string;
  role: 'teacher' | 'student';
  user_name: string;
  status: SessionStatus;
  created_at: string;
  expires_at: string;
  ended_at: string | null;
}

export interface ApiSessionHistoryResponse {
  id: number;
  room_code: string;
  role: 'teacher' | 'student';
  user_name: string;
  status: SessionStatus;
  created_at: string;
  ended_at: string | null;
  participant_count: number;
}

function mapBattleSessionResponse(
  session: BattleSessionResponse | null
): ApiBattleSessionResponse | null {
  if (!session) return null;
  return {
    id: session.id,
    user_id: session.user_id,
    room_code: session.room_code,
    is_host: session.is_host,
    player_name: session.player_name ?? '',
    status: session.status as SessionStatus,
    created_at: session.created_at,
    expires_at: session.expires_at,
    ended_at: null, // Not available in SDK response
  };
}

function mapClassroomSessionResponse(
  session: ClassroomSessionResponse | null
): ApiClassroomSessionResponse | null {
  if (!session) return null;
  return {
    id: session.id,
    user_id: session.user_id,
    classroom_id: session.classroom_id,
    room_code: session.room_code,
    role: session.role as 'teacher' | 'student',
    user_name: '', // Not available in SDK response
    status: session.status as SessionStatus,
    created_at: session.created_at,
    expires_at: session.expires_at,
    ended_at: null, // Not available in SDK response
  };
}

/**
 * Sessions API endpoints
 */
export const sessionsApi = {
  async getBattleSession(): Promise<ApiBattleSessionResponse | null> {
    const client = getLemonClient();
    const session = await wrapSdkCall(() => client.shenbiSessions.getBattle());
    return mapBattleSessionResponse(session);
  },

  async saveBattleSession(data: {
    room_code: string;
    is_host: boolean;
    player_name: string;
  }): Promise<ApiBattleSessionResponse> {
    const client = getLemonClient();
    const session = await wrapSdkCall(() =>
      client.shenbiSessions.createBattle({
        room_code: data.room_code,
        is_host: data.is_host,
        player_name: data.player_name,
      })
    );
    return mapBattleSessionResponse(session)!;
  },

  async clearBattleSession(): Promise<void> {
    const client = getLemonClient();
    await wrapSdkCall(() => client.shenbiSessions.endBattle());
  },

  async getClassroomSession(): Promise<ApiClassroomSessionResponse | null> {
    const client = getLemonClient();
    const session = await wrapSdkCall(() => client.shenbiSessions.getClassroom());
    return mapClassroomSessionResponse(session);
  },

  async saveClassroomSession(data: {
    classroom_id: number;
    room_code: string;
    role: 'teacher' | 'student';
    user_name: string;
  }): Promise<ApiClassroomSessionResponse> {
    const client = getLemonClient();
    // Note: user_name is not part of SDK ClassroomSessionCreate
    const session = await wrapSdkCall(() =>
      client.shenbiSessions.createClassroom({
        classroom_id: data.classroom_id,
        room_code: data.room_code,
        role: data.role,
      })
    );
    const mapped = mapClassroomSessionResponse(session)!;
    // Override user_name with the provided value
    return { ...mapped, user_name: data.user_name };
  },

  async clearClassroomSession(): Promise<void> {
    const client = getLemonClient();
    await wrapSdkCall(() => client.shenbiSessions.endClassroom());
  },
};

// ============================================
// Classroom Management API Types
// ============================================

export type MembershipStatus = 'active' | 'removed' | 'left';
export type AssignmentStatusType = 'draft' | 'published' | 'closed';

export interface ApiClassroomBrief {
  id: number;
  name: string;
  teacher_name: string | null;
  join_code: string;
  member_count: number;
  is_active: boolean;
  active_room_code: string | null;
}

export interface ApiClassroomResponse {
  id: number;
  teacher_id: number;
  teacher_name: string | null;
  name: string;
  description: string | null;
  join_code: string;
  is_active: boolean;
  allow_join: boolean;
  member_count: number;
  assignment_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApiClassroomListResponse {
  classrooms: ApiClassroomBrief[];
  total: number;
}

export interface ApiMemberResponse {
  id: number;
  student_id: number;
  student_name: string | null;
  display_name: string | null;
  status: MembershipStatus;
  joined_at: string;
  left_at: string | null;
}

export interface ApiMemberListResponse {
  members: ApiMemberResponse[];
  total: number;
}

export interface ApiAssignmentBrief {
  id: number;
  title: string;
  adventure_name: string | null;
  level_count: number;
  due_date: string | null;
  status: AssignmentStatusType;
}

export interface ApiAssignmentResponse {
  id: number;
  classroom_id: number;
  title: string;
  description: string | null;
  adventure_id: number | null;
  adventure_name: string | null;
  level_ids: number[] | null;
  level_count: number;
  max_points: number;
  due_date: string | null;
  status: AssignmentStatusType;
  created_at: string;
  published_at: string | null;
  updated_at: string;
}

export interface ApiAssignmentListResponse {
  assignments: ApiAssignmentBrief[];
  total: number;
}

export interface ApiStudentProgressResponse {
  id: number;
  student_id: number;
  student_name: string | null;
  levels_completed: number;
  total_levels: number;
  total_stars: number;
  max_stars: number;
  grade_percentage: number | null;
  manual_grade: number | null;
  effective_grade: number | null;
  teacher_notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
  is_complete: boolean;
}

export interface ApiGradebookEntry {
  student_id: number;
  student_name: string | null;
  assignments: Record<number, number | null>;
  average_grade: number | null;
}

export interface ApiGradebookResponse {
  classroom_id: number;
  classroom_name: string;
  assignments: ApiAssignmentBrief[];
  students: ApiGradebookEntry[];
}

function mapClassroomResponse(classroom: ClassroomResponse): ApiClassroomResponse {
  return {
    id: classroom.id,
    teacher_id: classroom.teacher_id,
    teacher_name: null,
    name: classroom.name,
    description: classroom.description,
    join_code: classroom.join_code,
    is_active: classroom.is_active,
    allow_join: classroom.allow_join,
    member_count: classroom.member_count ?? 0,
    assignment_count: 0,
    created_at: classroom.created_at,
    updated_at: classroom.created_at,
  };
}

function mapAssignmentResponse(assignment: AssignmentResponse): ApiAssignmentResponse {
  const levelIds = assignment.level_ids as number[] | null;
  return {
    id: assignment.id,
    classroom_id: assignment.classroom_id,
    title: assignment.title,
    description: assignment.description,
    adventure_id: assignment.adventure_id,
    adventure_name: null,
    level_ids: levelIds,
    level_count: levelIds?.length ?? 0,
    max_points: assignment.max_points,
    due_date: assignment.due_date,
    status: assignment.status as AssignmentStatusType,
    created_at: assignment.created_at,
    published_at: null,
    updated_at: assignment.created_at,
  };
}

/**
 * Classroom Management API endpoints
 */
export const classroomApi = {
  async createClassroom(data: { name: string; description?: string }): Promise<ApiClassroomResponse> {
    const client = getLemonClient();
    const classroom = await wrapSdkCall(() =>
      client.shenbiClassrooms.create({
        name: data.name,
        description: data.description,
      })
    );
    return mapClassroomResponse(classroom);
  },

  async listClassrooms(): Promise<ApiClassroomListResponse> {
    const client = getLemonClient();
    const classrooms = await wrapSdkCall(() => client.shenbiClassrooms.listOwned());
    return {
      classrooms: classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        teacher_name: null,
        join_code: c.join_code,
        member_count: c.member_count ?? 0,
        is_active: c.is_active,
        active_room_code: c.active_room_code ?? null,
      })),
      total: classrooms.length,
    };
  },

  async getClassroom(classroomId: number): Promise<ApiClassroomResponse> {
    const client = getLemonClient();
    const classroom = await wrapSdkCall(() => client.shenbiClassrooms.get(classroomId));
    return mapClassroomResponse(classroom);
  },

  async updateClassroom(
    classroomId: number,
    data: {
      name?: string;
      description?: string;
      allow_join?: boolean;
      is_active?: boolean;
    }
  ): Promise<ApiClassroomResponse> {
    const client = getLemonClient();
    const classroom = await wrapSdkCall(() =>
      client.shenbiClassrooms.update(classroomId, {
        name: data.name,
        description: data.description,
        allow_join: data.allow_join,
        is_active: data.is_active,
      })
    );
    return mapClassroomResponse(classroom);
  },

  async deleteClassroom(classroomId: number): Promise<void> {
    const client = getLemonClient();
    await wrapSdkCall(() => client.shenbiClassrooms.delete(classroomId));
  },

  async regenerateJoinCode(classroomId: number): Promise<{ join_code: string }> {
    const client = getLemonClient();
    const classroom = await wrapSdkCall(() =>
      client.shenbiClassrooms.regenerateCode(classroomId)
    );
    return { join_code: classroom.join_code };
  },

  async joinClassroom(joinCode: string, displayName?: string): Promise<ApiMemberResponse> {
    const client = getLemonClient();
    await wrapSdkCall(() => client.shenbiClassrooms.join({ code: joinCode }));
    return {
      id: 0,
      student_id: 0,
      student_name: displayName ?? null,
      display_name: displayName ?? null,
      status: 'active',
      joined_at: new Date().toISOString(),
      left_at: null,
    };
  },

  async leaveClassroom(classroomId: number): Promise<void> {
    const client = getLemonClient();
    await wrapSdkCall(() => client.shenbiClassrooms.leave(classroomId));
  },

  async getMyClasses(): Promise<ApiClassroomListResponse> {
    const client = getLemonClient();
    const classrooms = await wrapSdkCall(() => client.shenbiClassrooms.listEnrolled());
    return {
      classrooms: classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        teacher_name: null,
        join_code: c.join_code,
        member_count: c.member_count ?? 0,
        is_active: c.is_active,
        active_room_code: c.active_room_code ?? null,
      })),
      total: classrooms.length,
    };
  },

  async listMembers(classroomId: number): Promise<ApiMemberListResponse> {
    const client = getLemonClient();
    const members = await wrapSdkCall(() => client.shenbiClassrooms.listMembers(classroomId));
    return {
      members: members.map((m) => ({
        id: m.id,
        student_id: m.student_id,
        student_name: m.display_name ?? null, // SDK uses display_name
        display_name: m.display_name ?? null,
        status: m.status as MembershipStatus,
        joined_at: m.joined_at,
        left_at: m.left_at,
      })),
      total: members.length,
    };
  },

  async removeMember(classroomId: number, studentId: number): Promise<void> {
    const client = getLemonClient();
    await wrapSdkCall(() => client.shenbiClassrooms.removeMember(classroomId, studentId));
  },

  async createAssignment(
    classroomId: number,
    data: {
      title: string;
      description?: string;
      adventure_id?: number;
      level_ids?: number[];
      due_date?: string;
      max_points?: number;
    }
  ): Promise<ApiAssignmentResponse> {
    const client = getLemonClient();
    const assignment = await wrapSdkCall(() =>
      client.shenbiClassrooms.createAssignment(classroomId, {
        title: data.title,
        description: data.description,
        adventure_id: data.adventure_id,
        level_ids: data.level_ids,
        due_date: data.due_date,
        max_points: data.max_points,
      })
    );
    return mapAssignmentResponse(assignment);
  },

  async listAssignments(classroomId: number): Promise<ApiAssignmentListResponse> {
    const client = getLemonClient();
    const assignments = await wrapSdkCall(() =>
      client.shenbiClassrooms.listAssignments(classroomId, true)
    );
    return {
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        adventure_name: null,
        level_count: (a.level_ids as number[] | null)?.length ?? 0,
        due_date: a.due_date,
        status: a.status as AssignmentStatusType,
      })),
      total: assignments.length,
    };
  },

  async getAssignment(classroomId: number, assignmentId: number): Promise<ApiAssignmentResponse> {
    const client = getLemonClient();
    const assignment = await wrapSdkCall(() =>
      client.shenbiClassrooms.getAssignment(classroomId, assignmentId)
    );
    return mapAssignmentResponse(assignment);
  },

  async updateAssignment(
    classroomId: number,
    assignmentId: number,
    data: {
      title?: string;
      description?: string;
      adventure_id?: number;
      level_ids?: number[];
      due_date?: string;
      max_points?: number;
      status?: AssignmentStatusType;
    }
  ): Promise<ApiAssignmentResponse> {
    const client = getLemonClient();
    const assignment = await wrapSdkCall(() =>
      client.shenbiClassrooms.updateAssignment(classroomId, assignmentId, {
        title: data.title,
        description: data.description,
        adventure_id: data.adventure_id,
        level_ids: data.level_ids,
        due_date: data.due_date,
        max_points: data.max_points,
        status: toSdkAssignmentStatus(data.status),
      })
    );
    return mapAssignmentResponse(assignment);
  },

  async deleteAssignment(classroomId: number, assignmentId: number): Promise<void> {
    const client = getLemonClient();
    await wrapSdkCall(() => client.shenbiClassrooms.deleteAssignment(classroomId, assignmentId));
  },

  async publishAssignment(
    classroomId: number,
    assignmentId: number
  ): Promise<ApiAssignmentResponse> {
    const client = getLemonClient();
    const assignment = await wrapSdkCall(() =>
      client.shenbiClassrooms.publishAssignment(classroomId, assignmentId)
    );
    return mapAssignmentResponse(assignment);
  },

  async getAssignmentProgress(
    classroomId: number,
    assignmentId: number
  ): Promise<ApiStudentProgressResponse[]> {
    const client = getLemonClient();
    const submissions = await wrapSdkCall(() =>
      client.shenbiClassrooms.listSubmissions(classroomId, assignmentId)
    );
    return submissions.map((s) => ({
      id: s.id,
      student_id: s.student_id,
      student_name: s.display_name ?? null, // SDK uses display_name
      levels_completed: s.levels_completed,
      total_levels: s.total_levels,
      total_stars: s.total_stars,
      max_stars: s.total_levels * 3, // Max 3 stars per level
      grade_percentage: s.grade_percentage,
      manual_grade: s.manual_grade,
      effective_grade: s.final_grade ?? s.grade_percentage, // SDK uses final_grade
      teacher_notes: s.teacher_notes,
      started_at: null, // Not available in SDK
      completed_at: s.submitted_at, // SDK uses submitted_at
      last_activity_at: s.graded_at ?? s.submitted_at, // Approximate
      is_complete: s.submitted_at !== null,
    }));
  },

  async overrideGrade(
    classroomId: number,
    assignmentId: number,
    submissionId: number,
    data: {
      manual_grade?: number | null;
      teacher_notes?: string | null;
    }
  ): Promise<ApiStudentProgressResponse> {
    const client = getLemonClient();
    const submission = await wrapSdkCall(() =>
      client.shenbiClassrooms.gradeSubmission(classroomId, assignmentId, submissionId, {
        manual_grade: data.manual_grade,
        teacher_notes: data.teacher_notes,
      })
    );
    return {
      id: submission.id,
      student_id: submission.student_id,
      student_name: submission.display_name ?? null, // SDK uses display_name
      levels_completed: submission.levels_completed,
      total_levels: submission.total_levels,
      total_stars: submission.total_stars,
      max_stars: submission.total_levels * 3, // Max 3 stars per level
      grade_percentage: submission.grade_percentage,
      manual_grade: submission.manual_grade,
      effective_grade: submission.final_grade ?? submission.grade_percentage,
      teacher_notes: submission.teacher_notes,
      started_at: null, // Not available in SDK
      completed_at: submission.submitted_at,
      last_activity_at: submission.graded_at ?? submission.submitted_at,
      is_complete: submission.submitted_at !== null,
    };
  },

  async getGradebook(classroomId: number): Promise<ApiGradebookResponse> {
    const client = getLemonClient();
    const entries = await wrapSdkCall(() => client.shenbiClassrooms.getGradebook(classroomId));
    const classroom = await this.getClassroom(classroomId);
    const assignments = await this.listAssignments(classroomId);

    return {
      classroom_id: classroomId,
      classroom_name: classroom.name,
      assignments: assignments.assignments,
      students: entries.map((e: GradebookEntry) => {
        // Convert array of assignment records to Record<number, number | null>
        const assignmentGrades: Record<number, number | null> = {};
        if (Array.isArray(e.assignments)) {
          e.assignments.forEach((a: Record<string, unknown>) => {
            const assignmentId = a.assignment_id as number;
            const grade = a.grade as number | null;
            if (typeof assignmentId === 'number') {
              assignmentGrades[assignmentId] = grade ?? null;
            }
          });
        }
        return {
          student_id: e.student_id,
          student_name: e.display_name, // SDK uses display_name
          assignments: assignmentGrades,
          average_grade: e.average_grade,
        };
      }),
    };
  },

  async exportGradebook(_classroomId: number): Promise<Blob> {
    // Not implemented in SDK yet
    throw new ApiError('Gradebook export not implemented', 501);
  },

  async getSessionHistory(_classroomId: number): Promise<ApiSessionHistoryResponse[]> {
    // Not implemented in SDK yet
    return [];
  },

  async startLiveSession(
    _classroomId: number,
    _roomCode: string
  ): Promise<{ room_code: string; classroom_id: number }> {
    throw new ApiError('Live session management not implemented', 501);
  },

  async endLiveSession(_classroomId: number): Promise<void> {
    throw new ApiError('Live session management not implemented', 501);
  },
};
