/**
 * useClassroomRoom Hook
 *
 * Manages classroom room state persistence via API.
 * Allows rooms to survive page refreshes.
 */

import { useState, useCallback, useEffect } from 'react';
import { getStorage } from '../../infrastructure/storage/StorageProvider';
import type { ClassroomRole } from './types';
import { warn } from '../../infrastructure/logging';

const ROOM_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours (longer for classroom)

export interface ClassroomRoomState {
  classroomId: number;
  roomCode: string;
  role: ClassroomRole;
  userName: string;
  createdAt: number;
}

export interface UseClassroomRoomResult {
  /** Current saved room state (null if none or loading) */
  savedRoom: ClassroomRoomState | null;
  /** Whether we're loading the session from API */
  loading: boolean;
  /** Save a new room state */
  saveRoom: (classroomId: number, roomCode: string, role: ClassroomRole, userName: string) => void;
  /** Clear the saved room */
  clearRoom: () => void;
  /** Check if a room code matches the saved room */
  isMatchingRoom: (roomCode: string) => boolean;
}

/**
 * Hook for managing classroom room persistence
 */
export function useClassroomRoom(): UseClassroomRoomResult {
  const [savedRoom, setSavedRoom] = useState<ClassroomRoomState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from API on mount
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const session = await getStorage().getClassroomSession();
        if (!mounted) return;

        if (session) {
          // Check if session has expired
          if (Date.now() - session.createdAt > ROOM_EXPIRY_MS) {
            // Session expired, clear it
            await getStorage().clearClassroomSession();
            setSavedRoom(null);
          } else {
            setSavedRoom({
              classroomId: session.classroomId,
              roomCode: session.roomCode,
              role: session.role,
              userName: session.userName,
              createdAt: session.createdAt,
            });
          }
        }
      } catch (err) {
        warn('Failed to load classroom session', { error: err }, 'useClassroomRoom');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const saveRoom = useCallback(
    (classroomId: number, roomCode: string, role: ClassroomRole, userName: string) => {
      const state: ClassroomRoomState = {
        classroomId,
        roomCode,
        role,
        userName,
        createdAt: Date.now(),
      };

      // Update local state immediately
      setSavedRoom(state);

      // Save to API (fire and forget)
      getStorage()
        .saveClassroomSession({
          classroomId,
          roomCode,
          role,
          userName,
          createdAt: state.createdAt,
        })
        .catch((err) => {
          warn('Failed to save classroom session', { error: err, classroomId, roomCode }, 'useClassroomRoom');
        });
    },
    []
  );

  const clearRoom = useCallback(() => {
    setSavedRoom(null);

    // Clear from API (fire and forget)
    getStorage()
      .clearClassroomSession()
      .catch((err) => {
        warn('Failed to clear classroom session', { error: err }, 'useClassroomRoom');
      });
  }, []);

  const isMatchingRoom = useCallback(
    (roomCode: string) => {
      return savedRoom?.roomCode.toUpperCase() === roomCode.toUpperCase();
    },
    [savedRoom]
  );

  return {
    savedRoom,
    loading,
    saveRoom,
    clearRoom,
    isMatchingRoom,
  };
}
