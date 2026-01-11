/**
 * useLiveSession Hook (Polling-based)
 *
 * Manages live classroom sessions via REST API polling instead of WebRTC.
 * This provides more reliable connections through firewalls.
 *
 * Two modes:
 * - Teacher: Creates session, sets level, starts game, monitors students
 * - Student: Joins session, plays game, updates progress
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  liveSessionApi,
  type LiveSessionResponse,
  type LiveSessionStudentResponse,
  type JoinByCodeResponse,
} from '../../infrastructure/services/api';
import type { LevelDefinition } from '../engine/types';

// Live session status (matches API status values)
export type LiveSessionStatus =
  | 'idle' // Not in a session
  | 'creating' // Teacher creating a session
  | 'joining' // Student joining a session
  | 'waiting' // Waiting (teacher for students, student for start)
  | 'ready' // Level set, ready to start
  | 'playing' // Game in progress
  | 'ended'; // Session ended

export type LiveSessionRole = 'teacher' | 'student';

export interface StudentProgress {
  studentId: number;
  studentName: string;
  joinedAt: string;
  starsCollected: number;
  completed: boolean;
  completedAt: string | null;
  lastUpdatedAt: string;
}

export interface SessionSummary {
  totalStudents: number;
  completedCount: number;
  averageStars: number | null;
}

export interface LiveSessionState {
  status: LiveSessionStatus;
  sessionId: number | null;
  classroomId: number | null;
  roomCode: string | null;
  role: LiveSessionRole;
  teacherName: string | null;
  level: LevelDefinition | null;
  startedAt: string | null;
  // Teacher only: list of students
  students: StudentProgress[];
  summary: SessionSummary | null;
  // Student only: my progress
  myProgress: {
    starsCollected: number;
    completed: boolean;
  } | null;
  peerSummary: {
    totalStudents: number;
    completedCount: number;
  } | null;
}

export interface UseLiveSessionOptions {
  /** User's display name */
  userName: string;
  /** User's role */
  role: LiveSessionRole;
  /** Called when session state changes */
  onStateChange?: (state: LiveSessionState) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

export interface UseLiveSessionReturn {
  // State
  state: LiveSessionState;
  loading: boolean;
  error: string | null;

  // Teacher actions
  startSession: (classroomId: number) => Promise<void>;
  setLevel: (level: LevelDefinition) => Promise<void>;
  startPlaying: () => Promise<void>;
  resetSession: () => Promise<void>;
  endSession: () => Promise<void>;

  // Student actions
  joinSession: (classroomId: number) => Promise<void>;
  joinByCode: (roomCode: string) => Promise<void>;
  updateProgress: (starsCollected: number, completed: boolean, code?: string) => Promise<void>;
  leaveSession: () => Promise<void>;

  // Shared
  refreshState: () => Promise<void>;
}

const initialState: LiveSessionState = {
  status: 'idle',
  sessionId: null,
  classroomId: null,
  roomCode: null,
  role: 'student',
  teacherName: null,
  level: null,
  startedAt: null,
  students: [],
  summary: null,
  myProgress: null,
  peerSummary: null,
};

// Polling intervals
const POLLING_INTERVAL_WAITING = 1000; // 1s when waiting
const POLLING_INTERVAL_PLAYING = 2000; // 2s during gameplay (less frequent than battle)

export function useLiveSession({
  userName,
  role,
  onStateChange,
  onError,
}: UseLiveSessionOptions): UseLiveSessionReturn {
  const [state, setState] = useState<LiveSessionState>({ ...initialState, role });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Polling timer ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Callback refs to avoid stale closures
  const onStateChangeRef = useRef(onStateChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
    onErrorRef.current = onError;
  }, [onStateChange, onError]);

  // Convert student API response to local state
  const studentResponseToState = useCallback(
    (response: LiveSessionStudentResponse): LiveSessionState => {
      // Map API status to our status
      let status: LiveSessionStatus;
      switch (response.status) {
        case 'waiting':
          status = 'waiting';
          break;
        case 'ready':
          status = 'ready';
          break;
        case 'playing':
          status = 'playing';
          break;
        case 'ended':
          status = 'ended';
          break;
        default:
          status = 'idle';
      }

      const myProgress = response.my_progress
        ? {
            starsCollected: response.my_progress.stars_collected,
            completed: response.my_progress.completed,
          }
        : null;

      const peerSummary = response.peer_summary
        ? {
            totalStudents: response.peer_summary.total_students,
            completedCount: response.peer_summary.completed_count,
          }
        : null;

      return {
        status,
        sessionId: response.id,
        classroomId: response.classroom_id,
        roomCode: response.room_code,
        role: 'student',
        teacherName: response.teacher_name,
        level: response.level as LevelDefinition | null,
        startedAt: response.started_at || null,
        students: [],
        summary: null,
        myProgress,
        peerSummary,
      };
    },
    []
  );

  // Convert API response to local state
  const apiResponseToState = useCallback(
    (response: LiveSessionResponse, currentRole: LiveSessionRole): LiveSessionState => {
      // Map API status to our status
      let status: LiveSessionStatus;
      switch (response.status) {
        case 'waiting':
          status = 'waiting';
          break;
        case 'ready':
          status = 'ready';
          break;
        case 'playing':
          status = 'playing';
          break;
        case 'ended':
          status = 'ended';
          break;
        default:
          status = 'idle';
      }

      // Parse students from API response
      const students: StudentProgress[] = (response.students || []).map((s) => ({
        studentId: s.student_id,
        studentName: s.student_name,
        joinedAt: s.joined_at,
        starsCollected: s.stars_collected,
        completed: s.completed,
        completedAt: s.completed_at || null,
        lastUpdatedAt: s.last_updated_at,
      }));

      // Parse summary
      const summary: SessionSummary | null = response.summary
        ? {
            totalStudents: response.summary.total_students,
            completedCount: response.summary.completed_count,
            averageStars: response.summary.average_stars ?? null,
          }
        : null;

      // For student view, we get my_progress and peer_summary from the response
      // The API returns different fields based on role
      const studentResponse = response as unknown as {
        my_progress?: { stars_collected: number; completed: boolean };
        peer_summary?: { total_students: number; completed_count: number };
      };

      const myProgress = studentResponse.my_progress
        ? {
            starsCollected: studentResponse.my_progress.stars_collected,
            completed: studentResponse.my_progress.completed,
          }
        : null;

      const peerSummary = studentResponse.peer_summary
        ? {
            totalStudents: studentResponse.peer_summary.total_students,
            completedCount: studentResponse.peer_summary.completed_count,
          }
        : null;

      return {
        status,
        sessionId: response.id,
        classroomId: response.classroom_id,
        roomCode: response.room_code,
        role: currentRole,
        teacherName: response.teacher_name,
        level: response.level as LevelDefinition | null,
        startedAt: response.started_at || null,
        students,
        summary,
        myProgress,
        peerSummary,
      };
    },
    []
  );

  // Poll session state
  const pollSessionState = useCallback(
    async (classroomId: number, currentRole: LiveSessionRole) => {
      try {
        const response = await liveSessionApi.get(classroomId);
        const newState = apiResponseToState(response, currentRole);

        setState(newState);
        onStateChangeRef.current?.(newState);

        // Stop polling if session ended
        if (response.status === 'ended') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (err) {
        // If 404, session doesn't exist anymore
        const errorMsg = err instanceof Error ? err.message : 'Failed to get session state';

        // Stop polling on error
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        // Only report error if we were in an active session
        if (state.status !== 'idle') {
          setError(errorMsg);
          onErrorRef.current?.(errorMsg);
        }
      }
    },
    [apiResponseToState, state.status]
  );

  // Start polling
  const startPolling = useCallback(
    (classroomId: number, currentRole: LiveSessionRole, interval: number) => {
      // Clear existing polling
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      // Initial poll
      pollSessionState(classroomId, currentRole);

      // Start interval
      pollingRef.current = setInterval(() => {
        pollSessionState(classroomId, currentRole);
      }, interval);
    },
    [pollSessionState]
  );

  // =========================================
  // Teacher Actions
  // =========================================

  // Start a new session
  const startSession = useCallback(
    async (classroomId: number) => {
      if (role !== 'teacher') {
        const errorMsg = 'Only teachers can start sessions';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await liveSessionApi.start(classroomId);
        const newState = apiResponseToState(response, 'teacher');
        setState(newState);
        onStateChangeRef.current?.(newState);

        // Start polling
        startPolling(classroomId, 'teacher', POLLING_INTERVAL_WAITING);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to start session';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [role, apiResponseToState, startPolling]
  );

  // Set the level
  const setLevel = useCallback(
    async (level: LevelDefinition) => {
      if (!state.classroomId) {
        const errorMsg = 'No active session';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await liveSessionApi.setLevel(state.classroomId, {
          level: level as unknown as Record<string, unknown>,
        });
        // Refresh state
        await pollSessionState(state.classroomId, 'teacher');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to set level';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [state.classroomId, pollSessionState]
  );

  // Start playing
  const startPlaying = useCallback(async () => {
    if (!state.classroomId) {
      const errorMsg = 'No active session';
      setError(errorMsg);
      onErrorRef.current?.(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await liveSessionApi.startPlaying(state.classroomId);
      // Switch to playing polling interval
      startPolling(state.classroomId, 'teacher', POLLING_INTERVAL_PLAYING);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start playing';
      setError(errorMsg);
      onErrorRef.current?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [state.classroomId, startPolling]);

  // Reset session
  const resetSession = useCallback(async () => {
    if (!state.classroomId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await liveSessionApi.reset(state.classroomId);
      await pollSessionState(state.classroomId, 'teacher');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reset session';
      setError(errorMsg);
      onErrorRef.current?.(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [state.classroomId, pollSessionState]);

  // End session
  const endSession = useCallback(async () => {
    // Stop polling first
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (state.classroomId) {
      try {
        await liveSessionApi.end(state.classroomId);
      } catch {
        // Ignore errors when ending
      }
    }

    // Reset state
    setState({ ...initialState, role });
  }, [state.classroomId, role]);

  // =========================================
  // Student Actions
  // =========================================

  // Join session by classroom ID
  const joinSession = useCallback(
    async (classroomId: number) => {
      if (role !== 'student') {
        const errorMsg = 'Only students can join sessions';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = (await liveSessionApi.join(classroomId, {
          student_name: userName,
        })) as LiveSessionStudentResponse;
        const newState = studentResponseToState(response);
        setState(newState);
        onStateChangeRef.current?.(newState);

        // Start polling
        startPolling(classroomId, 'student', POLLING_INTERVAL_WAITING);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to join session';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [role, userName, studentResponseToState, startPolling]
  );

  // Join session by room code
  const joinByCode = useCallback(
    async (roomCode: string) => {
      const normalizedCode = roomCode.toUpperCase().trim();
      if (normalizedCode.length !== 6) {
        const errorMsg = 'Invalid room code';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = (await liveSessionApi.joinByCode({
          room_code: normalizedCode,
          student_name: userName,
        })) as JoinByCodeResponse;

        const classroomId = response.classroom_id;
        const newState = studentResponseToState(response.session);
        setState(newState);
        onStateChangeRef.current?.(newState);

        // Start polling
        startPolling(classroomId, 'student', POLLING_INTERVAL_WAITING);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to join session';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [userName, studentResponseToState, startPolling]
  );

  // Update progress
  const updateProgress = useCallback(
    async (starsCollected: number, completed: boolean, code?: string) => {
      if (!state.classroomId) {
        return;
      }

      try {
        await liveSessionApi.updateProgress(state.classroomId, {
          stars_collected: starsCollected,
          completed,
          code: code || null,
        });
      } catch (err) {
        // Don't show error for progress updates, just log
        console.error('Failed to update progress:', err);
      }
    },
    [state.classroomId]
  );

  // Leave session
  const leaveSession = useCallback(async () => {
    // Stop polling first
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (state.classroomId) {
      try {
        await liveSessionApi.leave(state.classroomId);
      } catch {
        // Ignore errors when leaving
      }
    }

    // Reset state
    setState({ ...initialState, role });
  }, [state.classroomId, role]);

  // =========================================
  // Shared Actions
  // =========================================

  // Refresh state manually
  const refreshState = useCallback(async () => {
    if (state.classroomId) {
      await pollSessionState(state.classroomId, state.role);
    }
  }, [state.classroomId, state.role, pollSessionState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  return {
    state,
    loading,
    error,
    // Teacher actions
    startSession,
    setLevel,
    startPlaying,
    resetSession,
    endSession,
    // Student actions
    joinSession,
    joinByCode,
    updateProgress,
    leaveSession,
    // Shared
    refreshState,
  };
}
