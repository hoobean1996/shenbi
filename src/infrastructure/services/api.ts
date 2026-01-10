/**
 * API Client for Shenbi Backend
 * Uses @lemonade/sdk for all API calls.
 *
 * This module re-exports SDK types and provides thin wrappers around SDK methods.
 */

import { getLemonClient } from '../../features/shared/contexts/AuthContext';

// Re-export SDK types for use throughout the app
export {
  GameType,
  AssignmentStatus,
} from '@lemonade/sdk';

export type {
  // Adventure types
  AdventureListResponse,
  AdventureResponse,
  AdventureCreate,
  AdventureUpdate,
  LevelResponse,
  LevelCreate,
  LevelUpdate,
  // Progress types
  ProgressResponse,
  ProgressCreate,
  StatsResponse,
  // Profile types
  ProfileResponse,
  ProfileUpdate,
  // Settings types
  SettingsResponse,
  SettingsUpdate,
  // Achievement types
  AchievementResponse,
  AchievementCreate,
  // Classroom types
  ClassroomResponse,
  ClassroomCreate,
  ClassroomUpdate,
  JoinClassroomRequest,
  MemberResponse,
  // Assignment types
  AssignmentResponse,
  AssignmentCreate,
  AssignmentUpdate,
  SubmissionResponse,
  SubmissionGrade,
  GradebookEntry,
  // Session types
  BattleSessionResponse,
  BattleSessionCreate,
  ClassroomSessionResponse,
  ClassroomSessionCreate,
} from '@lemonade/sdk';

// Standard library function type (frontend-specific, not in SDK)
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
 * Adventure API
 */
export const adventureApi = {
  list: (publishedOnly = true, gameType?: string) =>
    wrapSdkCall(() => getLemonClient().shenbiAdventures.list(publishedOnly, gameType)),

  get: (adventureId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiAdventures.get(adventureId)),

  create: (data: Parameters<ReturnType<typeof getLemonClient>['shenbiAdventures']['create']>[0]) =>
    wrapSdkCall(() => getLemonClient().shenbiAdventures.create(data)),

  update: (adventureId: number, data: Parameters<ReturnType<typeof getLemonClient>['shenbiAdventures']['update']>[1]) =>
    wrapSdkCall(() => getLemonClient().shenbiAdventures.update(adventureId, data)),

  delete: (adventureId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiAdventures.delete(adventureId)),

  listLevels: (adventureId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiAdventures.listLevels(adventureId)),

  createLevel: (adventureId: number, data: Parameters<ReturnType<typeof getLemonClient>['shenbiAdventures']['createLevel']>[1]) =>
    wrapSdkCall(() => getLemonClient().shenbiAdventures.createLevel(adventureId, data)),

  updateLevel: (adventureId: number, levelId: number, data: Parameters<ReturnType<typeof getLemonClient>['shenbiAdventures']['updateLevel']>[2]) =>
    wrapSdkCall(() => getLemonClient().shenbiAdventures.updateLevel(adventureId, levelId, data)),

  deleteLevel: (adventureId: number, levelId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiAdventures.deleteLevel(adventureId, levelId)),
};

/**
 * Profile API
 */
export const profileApi = {
  get: () =>
    wrapSdkCall(() => getLemonClient().shenbiProfile.get()),

  update: (data: Parameters<ReturnType<typeof getLemonClient>['shenbiProfile']['update']>[0]) =>
    wrapSdkCall(() => getLemonClient().shenbiProfile.update(data)),

  getStats: () =>
    wrapSdkCall(() => getLemonClient().shenbiProfile.getStats()),
};

/**
 * Progress API
 */
export const progressApi = {
  getAll: () =>
    wrapSdkCall(() => getLemonClient().shenbiProgress.getAll()),

  getByAdventure: (adventureId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiProgress.getByAdventure(adventureId)),

  getByLevel: (adventureId: number, levelId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiProgress.getByLevel(adventureId, levelId)),

  save: (data: Parameters<ReturnType<typeof getLemonClient>['shenbiProgress']['save']>[0]) =>
    wrapSdkCall(() => getLemonClient().shenbiProgress.save(data)),
};

/**
 * Settings API
 */
export const settingsApi = {
  get: () =>
    wrapSdkCall(() => getLemonClient().shenbiSettings.get()),

  update: (data: Parameters<ReturnType<typeof getLemonClient>['shenbiSettings']['update']>[0]) =>
    wrapSdkCall(() => getLemonClient().shenbiSettings.update(data)),

  completeTour: (tourId: string) =>
    wrapSdkCall(() => getLemonClient().shenbiSettings.completeTour(tourId)),
};

/**
 * Achievements API
 */
export const achievementsApi = {
  list: () =>
    wrapSdkCall(() => getLemonClient().shenbiAchievements.list()),

  award: (data: Parameters<ReturnType<typeof getLemonClient>['shenbiAchievements']['award']>[0]) =>
    wrapSdkCall(() => getLemonClient().shenbiAchievements.award(data)),

  check: (achievementId: string) =>
    wrapSdkCall(() => getLemonClient().shenbiAchievements.check(achievementId)),
};

/**
 * Sessions API
 */
export const sessionsApi = {
  getBattle: () =>
    wrapSdkCall(() => getLemonClient().shenbiSessions.getBattle()),

  createBattle: (data: Parameters<ReturnType<typeof getLemonClient>['shenbiSessions']['createBattle']>[0]) =>
    wrapSdkCall(() => getLemonClient().shenbiSessions.createBattle(data)),

  endBattle: () =>
    wrapSdkCall(() => getLemonClient().shenbiSessions.endBattle()),

  getClassroom: () =>
    wrapSdkCall(() => getLemonClient().shenbiSessions.getClassroom()),

  createClassroom: (data: Parameters<ReturnType<typeof getLemonClient>['shenbiSessions']['createClassroom']>[0]) =>
    wrapSdkCall(() => getLemonClient().shenbiSessions.createClassroom(data)),

  endClassroom: () =>
    wrapSdkCall(() => getLemonClient().shenbiSessions.endClassroom()),
};

/**
 * Classroom API
 */
export const classroomApi = {
  create: (data: Parameters<ReturnType<typeof getLemonClient>['shenbiClassrooms']['create']>[0]) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.create(data)),

  listOwned: () =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.listOwned()),

  listEnrolled: () =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.listEnrolled()),

  get: (classroomId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.get(classroomId)),

  update: (classroomId: number, data: Parameters<ReturnType<typeof getLemonClient>['shenbiClassrooms']['update']>[1]) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.update(classroomId, data)),

  delete: (classroomId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.delete(classroomId)),

  regenerateCode: (classroomId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.regenerateCode(classroomId)),

  join: (data: Parameters<ReturnType<typeof getLemonClient>['shenbiClassrooms']['join']>[0]) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.join(data)),

  leave: (classroomId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.leave(classroomId)),

  listMembers: (classroomId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.listMembers(classroomId)),

  removeMember: (classroomId: number, studentId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.removeMember(classroomId, studentId)),

  // Assignments
  createAssignment: (classroomId: number, data: Parameters<ReturnType<typeof getLemonClient>['shenbiClassrooms']['createAssignment']>[1]) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.createAssignment(classroomId, data)),

  listAssignments: (classroomId: number, includeAll = false) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.listAssignments(classroomId, includeAll)),

  getAssignment: (classroomId: number, assignmentId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.getAssignment(classroomId, assignmentId)),

  updateAssignment: (classroomId: number, assignmentId: number, data: Parameters<ReturnType<typeof getLemonClient>['shenbiClassrooms']['updateAssignment']>[2]) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.updateAssignment(classroomId, assignmentId, data)),

  deleteAssignment: (classroomId: number, assignmentId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.deleteAssignment(classroomId, assignmentId)),

  publishAssignment: (classroomId: number, assignmentId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.publishAssignment(classroomId, assignmentId)),

  // Submissions & Grading
  listSubmissions: (classroomId: number, assignmentId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.listSubmissions(classroomId, assignmentId)),

  gradeSubmission: (classroomId: number, assignmentId: number, submissionId: number, data: Parameters<ReturnType<typeof getLemonClient>['shenbiClassrooms']['gradeSubmission']>[3]) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.gradeSubmission(classroomId, assignmentId, submissionId, data)),

  getGradebook: (classroomId: number) =>
    wrapSdkCall(() => getLemonClient().shenbiClassrooms.getGradebook(classroomId)),
};

/**
 * Stripe API (placeholder - needs backend integration)
 */
export const stripeApi = {
  createCheckoutSession: async (): Promise<{ checkout_url: string }> => {
    throw new ApiError('Stripe integration not implemented', 501);
  },

  verifyCheckout: async (_sessionId: string): Promise<{ success: boolean; subscription_tier: string }> => {
    throw new ApiError('Stripe integration not implemented', 501);
  },

  resetToFree: async (): Promise<{ success: boolean; subscription_tier: string }> => {
    throw new ApiError('Stripe integration not implemented', 501);
  },
};
