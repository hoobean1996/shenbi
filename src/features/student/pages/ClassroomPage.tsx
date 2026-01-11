/**
 * ClassroomPage Component
 *
 * Student-only classroom mode - join a teacher's classroom.
 * Uses polling-based API instead of WebRTC for reliability.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveSession, StudentProgress } from '../../../core/classroom';
import { StudentLobby } from '../components/StudentLobby';
import { StudentGameView } from '../components/StudentGameView';
import { LevelDefinition } from '../../../core/engine';
import { useProfile } from '../../../infrastructure/storage';
import { useLanguage } from '../../../infrastructure/i18n';
import { Star, Home, Loader2 } from 'lucide-react';
import { info } from '../../../infrastructure/logging';

export default function ClassroomPage() {
  const navigate = useNavigate();
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const classroomId = classIdParam ? parseInt(classIdParam) : null;
  const { t } = useLanguage();

  // Get student name from profile
  const { profile } = useProfile();
  const studentName = profile?.name || 'Student';

  // Use the new polling-based live session hook
  const {
    state: sessionState,
    loading: sessionLoading,
    error: sessionError,
    joinSession,
    joinByCode,
    updateProgress,
    leaveSession,
  } = useLiveSession({
    userName: studentName,
    role: 'student',
    onError: (_err) => {
      // Navigate to /classroom on error if we were trying to join via URL
      if (urlRoomCode) {
        navigate('/classroom', { replace: true });
      }
    },
  });

  // Track if we've auto-joined
  const [hasAutoJoined, setHasAutoJoined] = useState(false);

  // Auto-join when visiting /classroom/:roomCode
  useEffect(() => {
    if (urlRoomCode && sessionState.status === 'idle' && !sessionLoading && !hasAutoJoined) {
      setHasAutoJoined(true);
      joinByCode(urlRoomCode);
    }
  }, [urlRoomCode, sessionState.status, sessionLoading, hasAutoJoined, joinByCode]);

  // Auto-join when coming from class detail page with classId
  useEffect(() => {
    if (classroomId && sessionState.status === 'idle' && !sessionLoading && !hasAutoJoined) {
      setHasAutoJoined(true);
      joinSession(classroomId);
    }
  }, [classroomId, sessionState.status, sessionLoading, hasAutoJoined, joinSession]);

  // Navigate to room URL when room code is set (after join)
  useEffect(() => {
    if (sessionState.roomCode && !urlRoomCode) {
      navigate(`/classroom/${sessionState.roomCode}`, { replace: true });
    }
  }, [sessionState.roomCode, urlRoomCode, navigate]);

  // Handle classroom join from lobby
  const handleJoinClassroom = useCallback(
    async (code: string) => {
      setHasAutoJoined(true);
      await joinByCode(code);
    },
    [joinByCode]
  );

  // Handle student progress update
  const handleProgressUpdate = useCallback(
    async (progress: StudentProgress) => {
      await updateProgress(progress.starsCollected, progress.completed);
    },
    [updateProgress]
  );

  // Handle student complete
  const handleStudentComplete = useCallback(() => {
    info('Level completed', undefined, 'ClassroomPage');
  }, []);

  // Handle exit
  const handleExit = useCallback(async () => {
    await leaveSession();
    navigate('/');
  }, [leaveSession, navigate]);

  // Derive UI status
  const getUIStatus = (): 'lobby' | 'waiting' | 'playing' | 'ended' => {
    switch (sessionState.status) {
      case 'idle':
      case 'joining':
        return 'lobby';
      case 'waiting':
      case 'ready':
        return 'waiting';
      case 'playing':
        return 'playing';
      case 'ended':
        return 'ended';
      default:
        return 'lobby';
    }
  };

  const uiStatus = getUIStatus();
  const currentLevel = sessionState.level as LevelDefinition | null;
  const isConnected = sessionState.roomCode !== null;

  // Loading state
  if (sessionLoading && sessionState.status === 'idle') {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#4a7a2a]" />
          <div className="text-gray-600 text-xl">Joining classroom...</div>
        </div>
      </div>
    );
  }

  // Session ended by teacher
  if (uiStatus === 'ended') {
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
  if (uiStatus === 'playing' && currentLevel && sessionState.teacherName) {
    return (
      <StudentGameView
        studentName={studentName}
        teacherName={sessionState.teacherName}
        level={currentLevel}
        onProgressUpdate={handleProgressUpdate}
        onComplete={handleStudentComplete}
        onExit={handleExit}
      />
    );
  }

  // Lobby/Waiting - join classroom or wait for teacher
  return (
    <StudentLobby
      studentName={studentName}
      roomCode={sessionState.roomCode}
      isConnected={isConnected}
      teacherName={sessionState.teacherName}
      level={currentLevel}
      error={sessionError}
      onJoinClassroom={handleJoinClassroom}
    />
  );
}
