/**
 * useClassroomConnection Hook
 *
 * Manages PeerJS WebRTC connections for classroom mode.
 * Teacher: manages multiple student connections (star topology)
 * Student: manages single connection to teacher
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import type { ClassroomMessage, ClassroomRole, StudentInfo } from './types';
import { generateRoomCode, createInitialProgress } from './types';
import { error as logError } from '../../infrastructure/logging';

interface UseClassroomConnectionOptions {
  role: ClassroomRole;
  userName: string;
  onMessage: (message: ClassroomMessage, fromStudentId?: string) => void;
  onStudentJoin?: (student: StudentInfo) => void;
  onStudentLeave?: (studentId: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
}

interface UseClassroomConnectionReturn {
  roomCode: string | null;
  isConnected: boolean;
  students: Map<string, StudentInfo>;
  studentCount: number;
  /** Create a new classroom. Optionally pass a specific code for reconnection. */
  createClassroom: (specificCode?: string) => void;
  joinClassroom: (code: string) => void;
  sendToAll: (message: ClassroomMessage) => void;
  sendToStudent: (studentId: string, message: ClassroomMessage) => void;
  sendToTeacher: (message: ClassroomMessage) => void;
  disconnect: () => void;
}

export function useClassroomConnection({
  role,
  userName,
  onMessage,
  onStudentJoin,
  onStudentLeave,
  onConnected,
  onDisconnected,
  onError,
}: UseClassroomConnectionOptions): UseClassroomConnectionReturn {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [students, setStudents] = useState<Map<string, StudentInfo>>(new Map());

  const peerRef = useRef<Peer | null>(null);
  // Teacher: map of student connections
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  // Student: single connection to teacher
  const teacherConnectionRef = useRef<DataConnection | null>(null);

  // Use refs to always have latest callback versions (avoids stale closures)
  const onMessageRef = useRef(onMessage);
  const onStudentJoinRef = useRef(onStudentJoin);
  const onStudentLeaveRef = useRef(onStudentLeave);
  const onConnectedRef = useRef(onConnected);
  const onDisconnectedRef = useRef(onDisconnected);
  const onErrorRef = useRef(onError);

  // Keep refs in sync with latest callbacks
  useEffect(() => {
    onMessageRef.current = onMessage;
    onStudentJoinRef.current = onStudentJoin;
    onStudentLeaveRef.current = onStudentLeave;
    onConnectedRef.current = onConnected;
    onDisconnectedRef.current = onDisconnected;
    onErrorRef.current = onError;
  }, [onMessage, onStudentJoin, onStudentLeave, onConnected, onDisconnected, onError]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Close all student connections (teacher mode)
    connectionsRef.current.forEach((conn) => conn.close());
    connectionsRef.current.clear();

    // Close teacher connection (student mode)
    if (teacherConnectionRef.current) {
      teacherConnectionRef.current.close();
      teacherConnectionRef.current = null;
    }

    // Destroy peer
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setIsConnected(false);
    setRoomCode(null);
    setStudents(new Map());
  }, []);

  // Setup student connection handler (teacher mode)
  const setupStudentConnection = useCallback(
    (conn: DataConnection, studentId: string) => {
      connectionsRef.current.set(studentId, conn);

      conn.on('open', () => {
        // Send welcome message with teacher name
        conn.send({ type: 'teacher-welcome', teacherName: userName } as ClassroomMessage);
      });

      conn.on('data', (data) => {
        const message = data as ClassroomMessage;

        // Handle student-join to register student info
        if (message.type === 'student-join') {
          const studentInfo: StudentInfo = {
            id: message.studentId,
            name: message.name,
            connected: true,
            progress: createInitialProgress(),
          };

          setStudents((prev) => {
            const next = new Map(prev);
            next.set(studentId, studentInfo);
            return next;
          });

          onStudentJoinRef.current?.(studentInfo);
        }

        // Handle progress updates
        if (message.type === 'student-progress') {
          setStudents((prev) => {
            const next = new Map(prev);
            const existing = next.get(studentId);
            if (existing) {
              next.set(studentId, { ...existing, progress: message.progress });
            }
            return next;
          });
        }

        onMessageRef.current(message, studentId);
      });

      conn.on('close', () => {
        connectionsRef.current.delete(studentId);

        setStudents((prev) => {
          const next = new Map(prev);
          const existing = next.get(studentId);
          if (existing) {
            next.set(studentId, { ...existing, connected: false });
          }
          return next;
        });

        onStudentLeaveRef.current?.(studentId);
      });

      conn.on('error', (err) => {
        logError('Connection error with student', err, { studentId }, 'useClassroomConnection');
      });
    },
    [userName]
  );

  // Setup teacher connection handler (student mode)
  const setupTeacherConnection = useCallback(
    (conn: DataConnection) => {
      teacherConnectionRef.current = conn;

      conn.on('open', () => {
        setIsConnected(true);
        onConnectedRef.current?.();

        // Send join message with student info
        const studentId = peerRef.current?.id || 'unknown';
        conn.send({
          type: 'student-join',
          studentId,
          name: userName,
        } as ClassroomMessage);
      });

      conn.on('data', (data) => {
        onMessageRef.current(data as ClassroomMessage);
      });

      conn.on('close', () => {
        setIsConnected(false);
        teacherConnectionRef.current = null;
        onDisconnectedRef.current?.();
      });

      conn.on('error', (err) => {
        onErrorRef.current?.(err.message || 'Connection error');
      });
    },
    [userName]
  );

  // Create a classroom (teacher mode)
  // Optionally pass a specific code for reconnection
  const createClassroom = useCallback(
    (specificCode?: string) => {
      if (role !== 'teacher') return;

      cleanup();

      const code = specificCode || generateRoomCode();
      const peerId = `shenbi-classroom-${code}`;

      const peer = new Peer(peerId);
      peerRef.current = peer;

      peer.on('open', () => {
        setRoomCode(code);
        setIsConnected(true);
        onConnectedRef.current?.();
      });

      peer.on('connection', (conn) => {
        // Generate student ID from their peer ID
        const studentId = conn.peer;
        setupStudentConnection(conn, studentId);
      });

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          if (specificCode) {
            // If using specific code and it's unavailable, report error
            onErrorRef.current?.('Classroom code already in use');
          } else {
            // Room code already in use, try again with new code
            createClassroom();
          }
        } else {
          onErrorRef.current?.(err.message || 'Failed to create classroom');
        }
      });
    },
    [role, cleanup, setupStudentConnection]
  );

  // Join a classroom (student mode)
  const joinClassroom = useCallback(
    (code: string) => {
      if (role !== 'student') return;

      cleanup();

      const normalizedCode = code.toUpperCase().trim();
      if (normalizedCode.length !== 6) {
        onErrorRef.current?.('Invalid room code');
        return;
      }

      const peer = new Peer();
      peerRef.current = peer;
      setRoomCode(normalizedCode);

      let connectionOpened = false;

      peer.on('open', () => {
        // Connect to teacher
        const teacherId = `shenbi-classroom-${normalizedCode}`;
        const conn = peer.connect(teacherId, { reliable: true });

        setupTeacherConnection(conn);

        // Handle connection timeout
        const timeout = setTimeout(() => {
          if (!connectionOpened) {
            onErrorRef.current?.('Could not connect. Classroom may not exist.');
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
          onErrorRef.current?.('Classroom not found');
        } else {
          onErrorRef.current?.(err.message || 'Failed to join classroom');
        }
        // Clean up so UI shows error instead of stuck on "Connecting..."
        cleanup();
      });
    },
    [role, cleanup, setupTeacherConnection]
  );

  // Send message to all students (teacher only)
  const sendToAll = useCallback(
    (message: ClassroomMessage) => {
      if (role !== 'teacher') return;

      connectionsRef.current.forEach((conn) => {
        if (conn.open) {
          conn.send(message);
        }
      });
    },
    [role]
  );

  // Send message to specific student (teacher only)
  const sendToStudent = useCallback(
    (studentId: string, message: ClassroomMessage) => {
      if (role !== 'teacher') return;

      const conn = connectionsRef.current.get(studentId);
      if (conn?.open) {
        conn.send(message);
      }
    },
    [role]
  );

  // Send message to teacher (student only)
  const sendToTeacher = useCallback(
    (message: ClassroomMessage) => {
      if (role !== 'student') return;

      if (teacherConnectionRef.current?.open) {
        teacherConnectionRef.current.send(message);
      }
    },
    [role]
  );

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
    students,
    studentCount: students.size,
    createClassroom,
    joinClassroom,
    sendToAll,
    sendToStudent,
    sendToTeacher,
    disconnect,
  };
}
