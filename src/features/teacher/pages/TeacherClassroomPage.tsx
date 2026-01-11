/**
 * TeacherClassroomPage Component
 *
 * Teacher-only classroom mode - create session, manage students, run class.
 * Uses polling-based API instead of WebRTC for reliability.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveSession, StudentInfo } from '../../../core/classroom';
import { TeacherLobby } from '../components/TeacherLobby';
import { TeacherDashboard } from '../components/TeacherDashboard';
import { LevelDefinition } from '../../../core/engine';
import { useProfile } from '../../../infrastructure/storage';
import { loadAdventuresFromApi } from '../../../infrastructure/levels';
import { useLanguage } from '../../../infrastructure/i18n';
import { ConnectionError } from '../../shared/components/ConnectionError';
import { Loader2, Star, Home, RotateCcw } from 'lucide-react';
import { error as logError } from '../../../infrastructure/logging';

export default function TeacherClassroomPage() {
  const navigate = useNavigate();
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const classroomId = classIdParam ? parseInt(classIdParam) : null;
  const { t, language } = useLanguage();

  // Get teacher name from profile
  const { profile } = useProfile();
  const teacherName = profile?.name || 'Teacher';

  // Use the new polling-based live session hook
  const {
    state: sessionState,
    loading: sessionLoading,
    error: sessionError,
    startSession,
    setLevel,
    startPlaying,
    resetSession,
    endSession,
  } = useLiveSession({
    userName: teacherName,
    role: 'teacher',
    onError: (err) => {
      logError('Live session error', err, undefined, 'TeacherClassroomPage');
    },
  });

  // Level loading state
  const [levels, setLevels] = useState<LevelDefinition[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Show end session modal
  const [showEndModal, setShowEndModal] = useState(false);

  // Local selected level (before starting session)
  const [selectedLevel, setSelectedLevel] = useState<LevelDefinition | null>(null);

  // Load levels on mount
  useEffect(() => {
    async function loadLevels() {
      setIsLoadingLevels(true);
      setLoadError(null);
      try {
        const { adventures } = await loadAdventuresFromApi(language);
        // Flatten all levels from all adventures
        const allLevels = adventures.flatMap((a) => a.levels);
        setLevels(allLevels);
      } catch (err) {
        logError('Failed to load levels', err, undefined, 'TeacherClassroomPage');
        setLoadError(err instanceof Error ? err.message : 'Failed to load levels');
      } finally {
        setIsLoadingLevels(false);
      }
    }
    loadLevels();
  }, [language]);

  // Auto-start session when coming from class detail page with classId
  useEffect(() => {
    if (isLoadingLevels) return;

    // If we have classroomId and session is idle, start a new session
    if (classroomId && sessionState.status === 'idle' && !sessionLoading) {
      startSession(classroomId);
    }
  }, [classroomId, sessionState.status, sessionLoading, isLoadingLevels, startSession]);

  // Navigate to room URL when room code is generated
  useEffect(() => {
    if (sessionState.roomCode && !urlRoomCode) {
      navigate(`/t/classroom/${sessionState.roomCode}`, { replace: true });
    }
  }, [sessionState.roomCode, urlRoomCode, navigate]);

  // Handle creating classroom (called from lobby if no classId)
  const handleCreateClassroom = useCallback(async () => {
    if (!classroomId) {
      // If no classroomId, navigate back to select a class
      navigate('/t/classroom');
      return;
    }
    await startSession(classroomId);
  }, [classroomId, startSession, navigate]);

  // Handle level selection
  const handleSelectLevel = useCallback(
    async (level: LevelDefinition) => {
      setSelectedLevel(level);
      // Send level to server (and thus to all connected students via polling)
      await setLevel(level);
    },
    [setLevel]
  );

  // Handle starting class
  const handleStartClass = useCallback(async () => {
    if (selectedLevel) {
      await startPlaying();
    }
  }, [selectedLevel, startPlaying]);

  // Handle reset
  const handleReset = useCallback(async () => {
    await resetSession();
  }, [resetSession]);

  // Handle end session click - show modal
  const handleEndSession = useCallback(() => {
    setShowEndModal(true);
  }, []);

  // Handle confirming end session
  const handleConfirmEndSession = useCallback(async () => {
    await endSession();
    setShowEndModal(false);
    navigate('/t/classroom', { replace: true });
  }, [endSession, navigate]);

  // Handle go home from end modal
  const handleGoHome = useCallback(async () => {
    await endSession();
    navigate('/t');
  }, [endSession, navigate]);

  // Convert API students to the Map format expected by TeacherDashboard
  const studentsMap = useMemo(() => {
    const map = new Map<string, StudentInfo>();
    for (const student of sessionState.students) {
      map.set(student.studentId.toString(), {
        id: student.studentId.toString(),
        name: student.studentName,
        connected: true, // If they're in the list, they're connected
        progress: {
          starsCollected: student.starsCollected,
          completed: student.completed,
          entities: [], // Not available in polling API - not needed for dashboard
        },
      });
    }
    return map;
  }, [sessionState.students]);

  // Derive UI status
  const getUIStatus = (): 'lobby' | 'waiting' | 'ready' | 'playing' | 'ended' => {
    switch (sessionState.status) {
      case 'idle':
      case 'creating':
        return 'lobby';
      case 'waiting':
        return 'waiting';
      case 'ready':
        return 'ready';
      case 'playing':
        return 'playing';
      case 'ended':
        return 'ended';
      default:
        return 'lobby';
    }
  };

  const uiStatus = getUIStatus();
  const currentLevel = sessionState.level || selectedLevel;

  // Determine if connected (has a room code)
  const isConnected = sessionState.roomCode !== null;

  // Loading state - show when loading levels OR when auto-creating session
  const isAutoCreating = classroomId && sessionState.status === 'idle' && !sessionLoading;
  if (isLoadingLevels || (sessionLoading && sessionState.status === 'idle') || isAutoCreating) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#4a7a2a]" />
          <div className="text-gray-600 text-xl">
            {isAutoCreating ? 'Starting session...' : 'Loading...'}
          </div>
        </div>
      </div>
    );
  }

  // Error state - server down or session error
  if (loadError || sessionError) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center p-4">
        <ConnectionError
          message={loadError || sessionError || 'Unknown error'}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // End Session Modal - can appear on top of dashboard
  if (showEndModal) {
    return (
      <div className="min-h-full bg-gray-100">
        {/* Show dashboard in background */}
        {uiStatus === 'playing' && currentLevel && sessionState.roomCode && (
          <TeacherDashboard
            roomCode={sessionState.roomCode}
            level={currentLevel}
            students={studentsMap}
            onReset={handleReset}
            onEndSession={handleEndSession}
          />
        )}

        {/* End Session Modal */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center animate-[bounceIn_0.5s_ease-out]">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
              <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
            </div>

            <h2 className="text-2xl font-bold text-[#4a7a2a] mb-2">{t('classroom.wellDone')}</h2>
            <p className="text-gray-600 mb-6">{t('classroom.classEnded')}</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmEndSession}
                className="w-full py-4 bg-gradient-to-r from-[#5a8a3a] to-[#7dad4c] text-white text-xl font-bold rounded-2xl hover:opacity-90 shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-6 h-6" />
                {t('classroom.newSession')}
              </button>
              <button
                onClick={handleGoHome}
                className="w-full py-3 bg-[#e8f5e0] hover:bg-[#d4ecc8] text-[#4a7a2a] font-medium rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                {t('classroom.backToHome')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing - show dashboard
  if (uiStatus === 'playing' && currentLevel && sessionState.roomCode) {
    return (
      <TeacherDashboard
        roomCode={sessionState.roomCode}
        level={currentLevel}
        students={studentsMap}
        onReset={handleReset}
        onEndSession={handleEndSession}
      />
    );
  }

  // Lobby/Waiting/Ready - show lobby with students list
  return (
    <TeacherLobby
      roomCode={sessionState.roomCode}
      isConnected={isConnected}
      teacherName={teacherName}
      students={studentsMap}
      levels={levels}
      selectedLevel={selectedLevel}
      onCreateClassroom={handleCreateClassroom}
      onSelectLevel={handleSelectLevel}
      onStartClass={handleStartClass}
    />
  );
}
