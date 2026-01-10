/**
 * useBattleRoom Hook
 *
 * Manages battle room state persistence via API.
 * Allows rooms to survive page refreshes.
 */

import { useState, useCallback, useEffect } from 'react';
import { getStorage } from '../../infrastructure/storage/StorageProvider';
import { warn } from '../../infrastructure/logging';

const ROOM_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export interface BattleRoomState {
  roomCode: string;
  isHost: boolean;
  playerName: string;
  createdAt: number;
}

export interface UseBattleRoomResult {
  /** Current saved room state (null if none or loading) */
  savedRoom: BattleRoomState | null;
  /** Whether we're loading the session from API */
  loading: boolean;
  /** Save a new room state */
  saveRoom: (roomCode: string, isHost: boolean, playerName: string) => void;
  /** Clear the saved room */
  clearRoom: () => void;
  /** Check if a room code matches the saved room */
  isMatchingRoom: (roomCode: string) => boolean;
}

/**
 * Hook for managing battle room persistence
 */
export function useBattleRoom(): UseBattleRoomResult {
  const [savedRoom, setSavedRoom] = useState<BattleRoomState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from API on mount
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const session = await getStorage().getBattleSession();
        if (!mounted) return;

        if (session) {
          // Check if session has expired
          if (Date.now() - session.createdAt > ROOM_EXPIRY_MS) {
            // Session expired, clear it
            await getStorage().clearBattleSession();
            setSavedRoom(null);
          } else {
            setSavedRoom({
              roomCode: session.roomCode,
              isHost: session.isHost,
              playerName: session.playerName,
              createdAt: session.createdAt,
            });
          }
        }
      } catch (err) {
        warn('Failed to load battle session', { error: err }, 'useBattleRoom');
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

  const saveRoom = useCallback((roomCode: string, isHost: boolean, playerName: string) => {
    const state: BattleRoomState = {
      roomCode,
      isHost,
      playerName,
      createdAt: Date.now(),
    };

    // Update local state immediately
    setSavedRoom(state);

    // Save to API (fire and forget)
    getStorage()
      .saveBattleSession({
        roomCode,
        isHost,
        playerName,
        createdAt: state.createdAt,
      })
      .catch((err) => {
        warn('Failed to save battle session', { error: err, roomCode }, 'useBattleRoom');
      });
  }, []);

  const clearRoom = useCallback(() => {
    setSavedRoom(null);

    // Clear from API (fire and forget)
    getStorage()
      .clearBattleSession()
      .catch((err) => {
        warn('Failed to clear battle session', { error: err }, 'useBattleRoom');
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
