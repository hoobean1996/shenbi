/**
 * TeacherClassroomPage Component
 *
 * Teacher-only classroom mode - create classroom, manage students, run class.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useClassroomConnection,
  useClassroomRoom,
  ClassroomMessage,
  ClassroomStatus,
} from '../../../core/classroom';
import { TeacherLobby } from '../components/TeacherLobby';
import { TeacherDashboard } from '../components/TeacherDashboard';
import { LevelDefinition } from '../../../core/engine';
import { useProfile } from '../../../infrastructure/storage';
import { loadAdventuresFromApi } from '../../../infrastructure/levels';
import { useLanguage } from '../../../infrastructure/i18n';
// classroomApi removed - startLiveSession/endLiveSession not available in SDK
import { ConnectionError } from '../../shared/components/ConnectionError';
import { Loader2, Star, Home, RotateCcw } from 'lucide-react';
import { info, error as logError } from '../../../infrastructure/logging';

export default function TeacherClassroomPage() {
  const navigate = useNavigate();
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const { t, language } = useLanguage();

  // Get teacher name from profile
  const { profile } = useProfile();
  const teacherName = profile?.name || 'Teacher';

  // Classroom room persistence
  const { savedRoom, loading: sessionLoading, saveRoom, clearRoom } = useClassroomRoom();

  // Status and state
  const [status, setStatus] = useState<ClassroomStatus>('lobby');
  const [selectedLevel, setSelectedLevel] = useState<LevelDefinition | null>(null);
  const [levels, setLevels] = useState<LevelDefinition[]>([]);
  const [isLoadingLevels, setIsLoadingLevels] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Show end session modal
  const [showEndModal, setShowEndModal] = useState(false);

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

  // Handle incoming messages
  const handleMessage = useCallback((message: ClassroomMessage) => {
    // Handle student messages here if needed
    info('Message from student', { messageType: message.type }, 'TeacherClassroomPage');
  }, []);

  // Connection hook - teacher role
  const { roomCode, isConnected, students, createClassroom, sendToAll, sendToStudent, disconnect } =
    useClassroomConnection({
      role: 'teacher',
      userName: teacherName,
      onMessage: handleMessage,
      onStudentJoin: (student) => {
        info('Student joined', { studentName: student.name }, 'TeacherClassroomPage');
        // If we have a selected level, send it to the new student
        if (selectedLevel) {
          // Small delay to ensure connection is fully established
          setTimeout(() => {
            sendToStudent(student.id, { type: 'teacher-set-level', level: selectedLevel });
            // If class is already playing, also send start signal
            if (status === 'playing') {
              sendToStudent(student.id, { type: 'teacher-start' });
            }
          }, 100);
        }
      },
      onStudentLeave: (studentId) => {
        info('Student left', { studentId }, 'TeacherClassroomPage');
      },
      onConnected: () => {
        info('Classroom created', undefined, 'TeacherClassroomPage');
      },
      onDisconnected: () => {
        info('Disconnected', undefined, 'TeacherClassroomPage');
        setStatus('lobby');
        clearRoom();
        navigate('/t/classroom', { replace: true });
      },
      onError: (err) => {
        logError('Classroom error', err, undefined, 'TeacherClassroomPage');
      },
    });

  // Handle creating classroom
  const handleCreateClassroom = useCallback(() => {
    createClassroom();
  }, [createClassroom]);

  // Navigate to room URL when room code is generated (after create)
  useEffect(() => {
    if (roomCode && !urlRoomCode && classId) {
      // Classroom created, save to API and navigate to room URL
      saveRoom(parseInt(classId), roomCode, 'teacher', teacherName);
      // TODO: startLiveSession not available in SDK - live session state managed locally
      navigate(`/t/classroom/${roomCode}`, { replace: true });
    }
  }, [roomCode, urlRoomCode, classId, teacherName, saveRoom, navigate]);

  // Auto-connect when visiting /t/classroom/:roomCode with saved room
  useEffect(() => {
    // Wait for session to load from API before attempting reconnection
    if (sessionLoading) return;

    if (urlRoomCode && savedRoom && !roomCode && status === 'lobby') {
      // We have a URL room code and saved room state
      if (
        savedRoom.roomCode.toUpperCase() === urlRoomCode.toUpperCase() &&
        savedRoom.role === 'teacher'
      ) {
        // Saved room matches URL and we were teacher, try to recreate
        createClassroom(urlRoomCode.toUpperCase());
      } else {
        // URL doesn't match saved room or role mismatch, clear and redirect
        clearRoom();
        navigate('/t/classroom', { replace: true });
      }
    } else if (urlRoomCode && !savedRoom && status === 'lobby') {
      // URL has room code but no saved room - can't recreate as teacher without being original host
      // Redirect to lobby
      navigate('/t/classroom', { replace: true });
    }
  }, [
    urlRoomCode,
    savedRoom,
    sessionLoading,
    roomCode,
    status,
    createClassroom,
    clearRoom,
    navigate,
  ]);

  // Auto-create classroom when coming from class detail page with classId
  useEffect(() => {
    if (sessionLoading || isLoadingLevels) return;

    // If we have classId but no urlRoomCode and not connected, auto-create
    if (classId && !urlRoomCode && !roomCode && status === 'lobby') {
      createClassroom();
    }
  }, [classId, urlRoomCode, roomCode, status, sessionLoading, isLoadingLevels, createClassroom]);

  // Handle level selection
  const handleSelectLevel = useCallback(
    (level: LevelDefinition) => {
      setSelectedLevel(level);
      // Send level to all connected students
      sendToAll({ type: 'teacher-set-level', level });
    },
    [sendToAll]
  );

  // Handle starting class
  const handleStartClass = useCallback(() => {
    if (selectedLevel) {
      setStatus('playing');
      sendToAll({ type: 'teacher-start' });
    }
  }, [selectedLevel, sendToAll]);

  // Handle reset
  const handleReset = useCallback(() => {
    sendToAll({ type: 'teacher-reset' });
  }, [sendToAll]);

  // Handle end session click - show modal and notify students
  const handleEndSession = useCallback(() => {
    // Notify students that session is ending
    sendToAll({ type: 'teacher-end-session' });
    // TODO: endLiveSession not available in SDK - live session state managed locally
    // Show the end modal
    setShowEndModal(true);
  }, [sendToAll]);

  // Handle go home from end modal
  const handleGoHome = useCallback(() => {
    clearRoom();
    disconnect();
    navigate('/t');
  }, [disconnect, clearRoom, navigate]);

  // Loading state - show when loading levels OR when auto-creating from classId
  const isAutoCreating = classId && !urlRoomCode && !roomCode && status === 'lobby';
  if (isLoadingLevels || sessionLoading || isAutoCreating) {
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

  // Error state - server down
  if (loadError) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center p-4">
        <ConnectionError message={loadError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // End Session Modal - can appear on top of dashboard
  if (showEndModal) {
    return (
      <div className="min-h-full bg-gray-100">
        {/* Show dashboard in background */}
        {status === 'playing' && selectedLevel && roomCode && (
          <TeacherDashboard
            roomCode={roomCode}
            level={selectedLevel}
            students={students}
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
                onClick={() => {
                  setShowEndModal(false);
                  setStatus('lobby');
                  clearRoom();
                  disconnect();
                  navigate('/t/classroom', { replace: true });
                }}
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
  if (status === 'playing' && selectedLevel && roomCode) {
    return (
      <TeacherDashboard
        roomCode={roomCode}
        level={selectedLevel}
        students={students}
        onReset={handleReset}
        onEndSession={handleEndSession}
      />
    );
  }

  // Lobby - create classroom and wait for students
  return (
    <TeacherLobby
      roomCode={roomCode}
      isConnected={isConnected}
      teacherName={teacherName}
      students={students}
      levels={levels}
      selectedLevel={selectedLevel}
      onCreateClassroom={handleCreateClassroom}
      onSelectLevel={handleSelectLevel}
      onStartClass={handleStartClass}
    />
  );
}
