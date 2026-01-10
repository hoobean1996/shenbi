/**
 * usePeerConnection Hook
 *
 * Manages PeerJS WebRTC connection for battle mode.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import type { BattleMessage } from './types';
import { generateRoomCode } from './types';

interface UsePeerConnectionOptions {
  onMessage: (message: BattleMessage) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (error: string) => void;
}

interface UsePeerConnectionReturn {
  roomCode: string | null;
  isConnected: boolean;
  isHost: boolean;
  /** Create a new room. Optionally pass a specific code for reconnection. */
  createRoom: (specificCode?: string) => void;
  joinRoom: (code: string) => void;
  sendMessage: (message: BattleMessage) => void;
  disconnect: () => void;
}

export function usePeerConnection({
  onMessage,
  onConnected,
  onDisconnected,
  onError,
}: UsePeerConnectionOptions): UsePeerConnectionReturn {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);

  // Use refs to always have latest callback versions (avoids stale closures)
  const onMessageRef = useRef(onMessage);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);
  const onErrorRef = useRef(onError);

  // Keep refs in sync with latest callbacks
  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectedRef.current = onConnected;
    onDisconnectedRef.current = onDisconnected;
    onErrorRef.current = onError;
  }, [onMessage, onConnected, onDisconnected, onError]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setIsConnected(false);
    setRoomCode(null);
  }, []);

  // Setup connection handlers (uses refs to avoid stale closures)
  const setupConnection = useCallback(
    (conn: DataConnection) => {
      connectionRef.current = conn;

      conn.on('open', () => {
        setIsConnected(true);
        onConnectedRef.current();
      });

      conn.on('data', (data) => {
        onMessageRef.current(data as BattleMessage);
      });

      conn.on('close', () => {
        setIsConnected(false);
        onDisconnectedRef.current();
      });

      conn.on('error', (err) => {
        onErrorRef.current(err.message || 'Connection error');
      });
    },
    [] // No dependencies - uses refs
  );

  // Create a room (host mode)
  // Optionally pass a specific code for reconnection
  const createRoom = useCallback(
    (specificCode?: string) => {
      cleanup();

      const code = specificCode || generateRoomCode();
      // Use room code as peer ID (with prefix to avoid conflicts)
      const peerId = `shenbi-battle-${code}`;

      const peer = new Peer(peerId);
      peerRef.current = peer;
      setIsHost(true);

      peer.on('open', () => {
        setRoomCode(code);
      });

      peer.on('connection', (conn) => {
        setupConnection(conn);
      });

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          if (specificCode) {
            // If using specific code and it's unavailable, report error
            onErrorRef.current('Room code already in use');
          } else {
            // Room code already in use, try again with new code
            createRoom();
          }
        } else {
          onErrorRef.current(err.message || 'Failed to create room');
        }
      });
    },
    [cleanup, setupConnection]
  );

  // Join an existing room (guest mode)
  const joinRoom = useCallback(
    (code: string) => {
      cleanup();

      const normalizedCode = code.toUpperCase().trim();
      if (normalizedCode.length !== 6) {
        onErrorRef.current('Invalid room code');
        return;
      }

      const peer = new Peer();
      peerRef.current = peer;
      setIsHost(false);
      setRoomCode(normalizedCode);

      // Track if connection succeeded (to avoid stale closure issues)
      let connectionOpened = false;

      peer.on('open', () => {
        // Connect to host
        const hostId = `shenbi-battle-${normalizedCode}`;
        const conn = peer.connect(hostId, { reliable: true });

        setupConnection(conn);

        // Handle connection timeout using local flag instead of stale state
        const timeout = setTimeout(() => {
          if (!connectionOpened) {
            onErrorRef.current('Could not connect. Room may not exist.');
            cleanup();
          }
        }, 10000);

        conn.on('open', () => {
          connectionOpened = true;
          clearTimeout(timeout);
        });
      });

      peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') {
          onErrorRef.current('Room not found');
        } else {
          onErrorRef.current(err.message || 'Failed to join room');
        }
        // Clean up so UI shows error instead of stuck on "Connecting..."
        cleanup();
      });
    },
    [cleanup, setupConnection]
  );

  // Send a message to the connected peer
  const sendMessage = useCallback((message: BattleMessage) => {
    if (connectionRef.current && connectionRef.current.open) {
      connectionRef.current.send(message);
    }
  }, []);

  // Disconnect and cleanup
  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    roomCode,
    isConnected,
    isHost,
    createRoom,
    joinRoom,
    sendMessage,
    disconnect,
  };
}
