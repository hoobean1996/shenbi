/**
 * TeacherDashboard Component
 *
 * Real-time monitoring view of all students during class.
 */

import { ArrowLeft, RotateCcw, XCircle } from 'lucide-react';
import type { StudentInfo } from '../../../core/classroom';
import type { LevelDefinition } from '../../../core/engine';
import { StudentCard } from '../../shared/components/classroom/StudentCard';

interface TeacherDashboardProps {
  roomCode: string;
  level: LevelDefinition;
  students: Map<string, StudentInfo>;
  onReset: () => void;
  onEndSession: () => void;
}

export function TeacherDashboard({
  roomCode,
  level,
  students,
  onReset,
  onEndSession,
}: TeacherDashboardProps) {
  const studentList = Array.from(students.values());
  const connectedCount = studentList.filter((s) => s.connected).length;
  const completedCount = studentList.filter((s) => s.progress.completed).length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onEndSession}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              Exit
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#4a7a2a]">Classroom: {roomCode}</h1>
              <p className="text-sm text-gray-600">{level.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="flex items-center gap-4 mr-4">
              <div className="text-sm">
                <span className="text-gray-600">Students: </span>
                <span className="font-medium text-gray-800">
                  {connectedCount}/{studentList.length}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Completed: </span>
                <span className="font-medium text-green-600">
                  {completedCount}/{studentList.length}
                </span>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>
            <button
              onClick={onEndSession}
              className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* Student Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {studentList.length === 0 ? (
          <div className="text-center py-12 text-gray-600">No students have joined yet</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {studentList.map((student) => (
              <StudentCard key={student.id} student={student} level={level} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
