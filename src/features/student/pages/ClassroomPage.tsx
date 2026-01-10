/**
 * ClassroomPage Component
 *
 * Student-only classroom mode - join a teacher's classroom.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useClassroomConnection,
  useClassroomRoom,
  ClassroomMessage,
  ClassroomStatus,
  StudentProgress,
} from '../../../core/classroom';
import { StudentLobby } from '../components/StudentLobby';
import { StudentGameView } from '../components/StudentGameView';
import { LevelDefinition } from '../../../core/engine';
import { useProfile } from '../../../infrastructure/storage';
import { useLanguage } from '../../../infrastructure/i18n';
import { Star, Home } from 'lucide-react';
import { info } from '../../../infrastructure/logging';

export default function ClassroomPage() {
  const navigate = useNavigate();
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const { t } = useLanguage();

  // Get student name from profile
  const { profile } = useProfile();
  const studentName = profile?.name || 'Student';

  // Classroom room persistence
  const { savedRoom, loading: sessionLoading, saveRoom, clearRoom } = useClassroomRoom();

  // Status and state
  const [status, setStatus] = useState<ClassroomStatus>('lobby');
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<LevelDefinition | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const sessionEndedRef = useRef(false);

  // Handle incoming messages
  const handleMessage = useCallback(
    (message: ClassroomMessage) => {
      switch (message.type) {
        case 'teacher-welcome':
          setTeacherName(message.teacherName);
          break;

        case 'teacher-set-level':
          setLevel(message.level);
          break;

        case 'teacher-start':
          setStatus('playing');
          break;

        case 'teacher-reset':
          setStatus('waiting');
          setLevel(null);
          break;

        case 'teacher-end-session':
          sessionEndedRef.current = true;
          setSessionEnded(true);
          clearRoom();
          break;
      }
    },
    [clearRoom]
  );

  // Connection hook - always student role
  const { roomCode, isConnected, joinClassroom, sendToTeacher, disconnect } =
    useClassroomConnection({
      role: 'student',
      userName: studentName,
      onMessage: handleMessage,
      onConnected: () => {
        info('Connected to classroom', undefined, 'ClassroomPage');
        setError(null);
      },
      onDisconnected: () => {
        info('Disconnected from classroom', undefined, 'ClassroomPage');
        // Don't show error if session was ended gracefully by teacher
        if (!sessionEndedRef.current) {
          setError('Disconnected from classroom');
          setStatus('lobby');
          clearRoom();
          navigate('/classroom', { replace: true });
        }
      },
      onError: (err) => {
        setError(err);
        clearRoom();
        // Navigate to /classroom to show error on join form
        if (urlRoomCode) {
          navigate('/classroom', { replace: true });
        }
      },
    });

  // Handle classroom join
  const handleJoinClassroom = useCallback(
    (code: string) => {
      setError(null);
      joinClassroom(code);
    },
    [joinClassroom]
  );

  // Navigate to room URL when room code is set (after join)
  useEffect(() => {
    if (roomCode && !urlRoomCode && classId) {
      // Joined classroom, save to API and navigate to room URL
      saveRoom(parseInt(classId), roomCode, 'student', studentName);
      navigate(`/classroom/${roomCode}`, { replace: true });
    }
  }, [roomCode, urlRoomCode, classId, studentName, saveRoom, navigate]);

  // Auto-connect when visiting /classroom/:roomCode
  useEffect(() => {
    // Wait for session to load from API before attempting reconnection
    if (sessionLoading) return;

    // If we have a URL room code and not already connected, auto-join
    if (urlRoomCode && !roomCode && status === 'lobby' && !error) {
      // Check if we have a saved session matching this room code
      if (savedRoom && savedRoom.roomCode.toUpperCase() === urlRoomCode.toUpperCase()) {
        // Rejoin existing session
        setError(null);
        joinClassroom(urlRoomCode.toUpperCase());
      } else if (!savedRoom) {
        // No saved session - auto-join directly (e.g., from "Join Now" button)
        setError(null);
        joinClassroom(urlRoomCode.toUpperCase());
      }
    }
  }, [urlRoomCode, savedRoom, sessionLoading, roomCode, status, error, joinClassroom]);

  // Handle student progress update
  const handleProgressUpdate = useCallback(
    (progress: StudentProgress) => {
      sendToTeacher({ type: 'student-progress', studentId: 'self', progress });
    },
    [sendToTeacher]
  );

  // Handle student complete
  const handleStudentComplete = useCallback(() => {
    info('Level completed', undefined, 'ClassroomPage');
  }, []);

  // Handle exit
  const handleExit = useCallback(() => {
    clearRoom();
    disconnect();
    navigate('/');
  }, [disconnect, clearRoom, navigate]);

  // Session ended by teacher
  if (sessionEnded) {
    return (
      <div className="flex flex-col items-center min-h-full bg-white p-4 pt-16">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
            <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('classroom.sessionEnded')}</h2>

          <p className="text-gray-600 mb-6">{t('classroom.sessionEndedDesc')}</p>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5a8a3a] hover:bg-[#4a7a2a] text-white font-bold rounded-xl transition-colors"
          >
            <Home className="w-5 h-5" />
            {t('classroom.backToHome')}
          </button>
        </div>
      </div>
    );
  }

  // Playing the game
  if (status === 'playing' && level && teacherName) {
    return (
      <StudentGameView
        studentName={studentName}
        teacherName={teacherName}
        level={level}
        onProgressUpdate={handleProgressUpdate}
        onComplete={handleStudentComplete}
        onExit={handleExit}
      />
    );
  }

  // Lobby - join classroom
  return (
    <StudentLobby
      studentName={studentName}
      roomCode={roomCode}
      isConnected={isConnected}
      teacherName={teacherName}
      level={level}
      error={error}
      onJoinClassroom={handleJoinClassroom}
    />
  );
}
