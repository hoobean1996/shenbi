// Types
export {
  type StudentInfo,
  type StudentProgress,
  generateRoomCode,
  createInitialProgress,
} from './types';

// Polling-based hook
export { useLiveSession } from './useLiveSession';
export type {
  LiveSessionState,
  LiveSessionStatus,
  LiveSessionRole,
  StudentProgress as LiveStudentProgress,
  SessionSummary,
  UseLiveSessionOptions,
  UseLiveSessionReturn,
} from './useLiveSession';
