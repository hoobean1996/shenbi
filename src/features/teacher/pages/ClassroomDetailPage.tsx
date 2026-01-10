/**
 * Classroom Detail Page
 *
 * Shows classroom details with tabs for members, assignments, and gradebook.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  FileText,
  FileSpreadsheet,
  Settings,
  Loader2,
  Play,
  History,
} from 'lucide-react';
import { useLanguage } from '../../../infrastructure/i18n';
import {
  classroomApi,
  ApiClassroomResponse,
  ApiSessionHistoryResponse,
  ApiError,
} from '../../../infrastructure/services/api';
import MemberList from '../components/classroom-management/MemberList';
import AssignmentList from '../components/classroom-management/AssignmentList';
import GradebookTable from '../components/classroom-management/GradebookTable';
import JoinCodeDisplay from '../components/classroom-management/JoinCodeDisplay';
import ClassroomSettingsModal from '../components/classroom-management/ClassroomSettingsModal';
import { error as logError } from '../../../infrastructure/logging';

type TabType = 'members' | 'assignments' | 'gradebook' | 'sessions';

export default function ClassroomDetailPage() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t: _t } = useLanguage();

  const [classroom, setClassroom] = useState<ApiClassroomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState<ApiSessionHistoryResponse[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Get active tab from URL or default to 'members'
  const activeTab = (searchParams.get('tab') as TabType) || 'members';

  const setActiveTab = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const loadClassroom = useCallback(async () => {
    if (!classroomId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await classroomApi.getClassroom(parseInt(classroomId));
      setClassroom(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('Classroom not found');
        } else if (err.status === 403) {
          setError('You do not have access to this classroom');
        } else {
          setError(err.detail || err.message);
        }
      } else {
        setError('Failed to load classroom');
      }
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    loadClassroom();
  }, [loadClassroom]);

  const handleClassroomUpdated = (updated: ApiClassroomResponse) => {
    setClassroom(updated);
    setShowSettings(false);
  };

  // Load sessions when tab is selected
  const loadSessions = useCallback(async () => {
    if (!classroomId) return;
    try {
      setSessionsLoading(true);
      const data = await classroomApi.getSessionHistory(parseInt(classroomId));
      setSessions(data);
    } catch (err) {
      logError('Failed to load sessions', err, { classroomId }, 'ClassroomDetailPage');
    } finally {
      setSessionsLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    if (activeTab === 'sessions' && sessions.length === 0 && !sessionsLoading) {
      loadSessions();
    }
  }, [activeTab, sessions.length, sessionsLoading, loadSessions]);

  // Only show full-page loading on initial load (when no classroom data yet)
  if (loading && !classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4a7a2a]" />
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link
            to="/t/classes"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </Link>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              {error || 'Classroom not found'}
            </h2>
            <button
              onClick={() => navigate('/t/classes')}
              className="mt-4 px-6 py-2 bg-[#4a7a2a] text-white rounded-xl font-medium hover:bg-[#3a6a1a]"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link
            to="/t/classes"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-800">{classroom.name}</h1>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    classroom.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {classroom.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {classroom.description && (
                <p className="text-gray-600 mt-1">{classroom.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{classroom.member_count} students</span>
                <span>{classroom.assignment_count} assignments</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/t/classroom?classId=${classroom.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-[#4a7a2a] text-white rounded-xl font-medium hover:bg-[#3a6a1a] transition-colors"
              >
                <Play className="w-4 h-4" />
                Launch Live Session
              </button>
              <JoinCodeDisplay
                code={classroom.join_code}
                classroomId={classroom.id}
                allowJoin={classroom.allow_join}
                onCodeRegenerated={(newCode) => setClassroom({ ...classroom, join_code: newCode })}
              />
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-gray-200 -mb-px">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-[#4a7a2a] text-[#4a7a2a]'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Members
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'assignments'
                  ? 'border-[#4a7a2a] text-[#4a7a2a]'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Assignments
            </button>
            <button
              onClick={() => setActiveTab('gradebook')}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'gradebook'
                  ? 'border-[#4a7a2a] text-[#4a7a2a]'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Gradebook
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'sessions'
                  ? 'border-[#4a7a2a] text-[#4a7a2a]'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <History className="w-4 h-4" />
              Sessions
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'members' && (
          <MemberList
            classroomId={classroom.id}
            onMemberCountChange={(count) => setClassroom({ ...classroom, member_count: count })}
          />
        )}
        {activeTab === 'assignments' && (
          <AssignmentList
            classroomId={classroom.id}
            onAssignmentCountChange={(count) =>
              setClassroom({ ...classroom, assignment_count: count })
            }
          />
        )}
        {activeTab === 'gradebook' && <GradebookTable classroomId={classroom.id} />}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800">Live Session History</h3>
              <p className="text-sm text-gray-600">Past live classroom sessions</p>
            </div>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#4a7a2a]" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No live sessions yet</p>
                <p className="text-sm">Launch a live session to see it here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sessions.map((session) => (
                  <div key={session.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">Room: {session.room_code}</span>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            session.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : session.status === 'ended'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Started: {new Date(session.created_at).toLocaleString()}
                        {session.ended_at && (
                          <span className="ml-3">
                            Ended: {new Date(session.ended_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-800">
                        {session.participant_count} participant
                        {session.participant_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <ClassroomSettingsModal
          classroom={classroom}
          onClose={() => setShowSettings(false)}
          onUpdated={handleClassroomUpdated}
        />
      )}
    </div>
  );
}
