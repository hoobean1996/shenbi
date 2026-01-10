/**
 * StudentLobby Component
 *
 * Student's join/waiting room.
 */

import { useState } from 'react';
import { Loader2, Users, GraduationCap } from 'lucide-react';
import type { LevelDefinition } from '../../../core/engine';
import { useLanguage } from '../../../infrastructure/i18n';

interface StudentLobbyProps {
  studentName: string;
  roomCode: string | null;
  isConnected: boolean;
  teacherName: string | null;
  level: LevelDefinition | null;
  error: string | null;
  onJoinClassroom: (code: string) => void;
}

export function StudentLobby({
  studentName,
  roomCode,
  isConnected,
  teacherName,
  level,
  error,
  onJoinClassroom,
}: StudentLobbyProps) {
  const { t } = useLanguage();
  const [joinCode, setJoinCode] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinClassroom(joinCode.trim());
    }
  };

  // Connected and waiting for teacher to start
  if (isConnected && teacherName) {
    return (
      <div className="flex flex-col items-center min-h-full bg-white p-4 pt-16">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#e8f5e0] rounded-full mb-4">
            <GraduationCap className="w-10 h-10 text-[#4a7a2a]" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('classroom.connected')}</h2>

          <p className="text-gray-600 mb-6">
            {t('classroom.teacherLabel')}{' '}
            <span className="font-medium text-gray-700">{teacherName}</span>
          </p>

          <div className="bg-[#e8f5e0] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-[#4a7a2a] mb-2">
              <Users className="w-5 h-5" />
              <span className="font-medium">
                {t('classroom.yourNameLabel')} {studentName}
              </span>
            </div>
          </div>

          {level ? (
            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">{t('classroom.levelAssigned')}</p>
              <p className="font-medium text-gray-800">{level.name}</p>
            </div>
          ) : null}

          <div className="flex items-center justify-center gap-3 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t('classroom.waitingForTeacher')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Connecting to classroom
  if (roomCode && !isConnected) {
    return (
      <div className="flex flex-col items-center min-h-full bg-white p-4 pt-16">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 mx-auto text-[#4a7a2a] animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('classroom.connecting')}</h2>
          <p className="text-gray-600">
            {t('classroom.joiningClassroom')} {roomCode}
          </p>
        </div>
      </div>
    );
  }

  // Initial join form
  return (
    <div className="flex flex-col items-center min-h-full bg-white p-4 pt-16">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#e8f5e0] rounded-full mb-4">
            <Users className="w-10 h-10 text-[#4a7a2a]" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('classroom.joinClassroom')}</h1>
          <p className="text-gray-600">{t('classroom.enterCodeFromTeacher')}</p>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#e8f5e0] rounded-full">
            <span className="text-[#3a6a1a] font-bold">{studentName}</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-center">
            {error}
          </div>
        )}

        {/* Join Form */}
        <form onSubmit={handleJoinSubmit}>
          <label className="block text-gray-700 font-medium mb-2">
            {t('classroom.classroomCode')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABCDEF"
              maxLength={6}
              autoFocus
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-xl text-center uppercase tracking-widest focus:border-[#7dad4c] focus:outline-none"
            />
            <button
              type="submit"
              disabled={joinCode.length !== 6}
              className="px-6 py-3 bg-[#5a8a3a] hover:bg-[#4a7a2a] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
            >
              {t('classroom.join')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
