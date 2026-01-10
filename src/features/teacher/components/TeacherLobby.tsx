/**
 * TeacherLobby Component
 *
 * Teacher's waiting room - create classroom, wait for students, select level.
 */

import { useState } from 'react';
import { Copy, Check, Loader2, Users, Play, GraduationCap } from 'lucide-react';
import type { LevelDefinition } from '../../../core/engine';
import type { StudentInfo } from '../../../core/classroom';
import { BattleLevelPicker } from '../../student/components/battle/BattleLevelPicker';
import { useLanguage } from '../../../infrastructure/i18n';

interface TeacherLobbyProps {
  roomCode: string | null;
  isConnected: boolean;
  teacherName: string;
  students: Map<string, StudentInfo>;
  levels: LevelDefinition[];
  selectedLevel: LevelDefinition | null;
  onCreateClassroom: () => void;
  onSelectLevel: (level: LevelDefinition) => void;
  onStartClass: () => void;
}

export function TeacherLobby({
  roomCode,
  isConnected,
  teacherName,
  students,
  levels,
  selectedLevel,
  onCreateClassroom,
  onSelectLevel,
  onStartClass,
}: TeacherLobbyProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const connectedStudents = Array.from(students.values()).filter((s) => s.connected);
  const canStart = selectedLevel !== null;

  // Waiting for students (classroom created)
  if (roomCode && isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-white p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e8f5e0] rounded-full mb-3">
              <GraduationCap className="w-8 h-8 text-[#4a7a2a]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {teacherName}
              {t('classroom.teacherClassroom')}
            </h2>
          </div>

          {/* Room Code */}
          <div className="bg-gray-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 text-center mb-2">
              {t('classroom.shareCodeWithStudents')}
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-mono font-bold text-[#4a7a2a] tracking-widest">
                {roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-[#e8f5e0] hover:bg-[#d4ecc8] rounded-lg transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-[#4a7a2a]" />
                )}
              </button>
            </div>
          </div>

          {/* Connected Students */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">
                {t('classroom.students')} ({connectedStudents.length})
              </span>
            </div>

            {connectedStudents.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-gray-600 bg-gray-50 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('classroom.waitingForStudents')}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {connectedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-2 px-3 py-2 bg-[#e8f5e0] rounded-lg"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-700 truncate">{student.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Level Picker */}
          <div className="mb-6 border-t border-gray-200 pt-4">
            <BattleLevelPicker
              levels={levels}
              selectedLevel={selectedLevel}
              onSelectLevel={onSelectLevel}
            />
          </div>

          {/* Start Button */}
          <button
            onClick={onStartClass}
            disabled={!canStart}
            className="w-full bg-[#4a7a2a] hover:bg-[#3a6a1a] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-xl"
          >
            <Play className="w-6 h-6" />
            {t('classroom.startClass')}
          </button>

          {!canStart && (
            <p className="text-center text-gray-600 text-sm mt-3">
              {t('classroom.selectLevelToStart')}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Initial state - create classroom button
  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#e8f5e0] rounded-full mb-4">
            <GraduationCap className="w-10 h-10 text-[#4a7a2a]" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('classroom.teacherMode')}</h1>
          <p className="text-gray-600">{t('classroom.createClassroomDesc')}</p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#e8f5e0] rounded-full">
            <span className="text-[#3a6a1a] font-bold">{teacherName}</span>
          </div>
        </div>

        <button
          onClick={onCreateClassroom}
          className="w-full bg-[#4a7a2a] hover:bg-[#3a6a1a] text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-xl"
        >
          <Users className="w-6 h-6" />
          {t('classroom.createClassroom')}
        </button>
      </div>
    </div>
  );
}
