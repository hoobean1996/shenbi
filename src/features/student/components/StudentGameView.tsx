/**
 * StudentGameView Component
 *
 * Student's gameplay view with progress sync to teacher.
 * Uses the same UI layout as Adventure's GamePage.
 */

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Star } from 'lucide-react';
import type { LevelDefinition } from '../../../core/engine';
import type { StudentProgress } from '../../../core/classroom';
import { MazeAdventure, TurtleAdventure } from './adventures';
import { defaultTheme } from '../../../infrastructure/themes';
import { useLanguage } from '../../../infrastructure/i18n';

interface StudentGameViewProps {
  studentName: string;
  teacherName: string;
  level: LevelDefinition;
  onProgressUpdate: (progress: StudentProgress) => void;
  onComplete: () => void;
  onExit: () => void;
}

export function StudentGameView({
  studentName,
  teacherName,
  level,
  onProgressUpdate,
  onComplete,
  onExit,
}: StudentGameViewProps) {
  const { t } = useLanguage();

  // Game state
  const [resetKey, setResetKey] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [collectCount, setCollectCount] = useState(0);

  // Responsive screen size
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Determine game type from level (default to maze)
  const gameType = level.gameType || 'maze';

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1280);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle level completion
  const handleComplete = useCallback(
    (stars: number) => {
      setCollectCount(stars);
      setIsComplete(true);

      // Send progress update to teacher
      onProgressUpdate({
        starsCollected: stars,
        completed: true,
        entities: [],
      });

      onComplete();
    },
    [onProgressUpdate, onComplete]
  );

  // Handle level failure
  const handleFail = useCallback(() => {
    setShowFailure(true);
  }, []);

  // Handle code change (for progress tracking if needed)
  const handleCodeChange = useCallback(() => {
    // Could send code updates to teacher here if needed
  }, []);

  // Reset level
  const resetLevel = useCallback(() => {
    setIsComplete(false);
    setShowFailure(false);
    setResetKey((k) => k + 1);
  }, []);

  return (
    <div className="h-screen bg-white overflow-hidden flex flex-col">
      {/* Top Bar - Level Info */}
      <div className="flex-shrink-0 px-4 py-2 bg-white/10 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Back & Level Info */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200 hover:shadow-md hover:scale-105 transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-600 text-sm">Leave</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200">
              <span className="font-medium text-gray-700 text-sm">{level.name}</span>
            </div>
          </div>

          {/* Center: Teacher info */}
          <div className="text-center">
            <p className="text-xs text-gray-600">
              {t('classroom.teacher')}: {teacherName}
            </p>
          </div>

          {/* Right: Student name */}
          <div className="px-3 py-1.5 bg-[#e8f5e0] text-[#4a7a2a] rounded-full text-sm font-medium">
            {studentName}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 h-full overflow-hidden relative">
        {/* Game-specific component */}
        {gameType === 'maze' && (
          <MazeAdventure
            level={level}
            theme={defaultTheme}
            resetKey={resetKey}
            isLargeScreen={isLargeScreen}
            onComplete={handleComplete}
            onFail={handleFail}
            onCodeChange={handleCodeChange}
          />
        )}
        {gameType === 'turtle' && (
          <TurtleAdventure
            level={level}
            theme={defaultTheme}
            resetKey={resetKey}
            isLargeScreen={isLargeScreen}
            onComplete={handleComplete}
            onFail={handleFail}
            onCodeChange={handleCodeChange}
          />
        )}
      </div>

      {/* Victory Modal */}
      {isComplete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center animate-[bounceIn_0.5s_ease-out]">
            <div className="relative mb-4">
              <div className="absolute -top-2 -left-2 text-4xl animate-ping">✨</div>
              <div
                className="absolute -top-2 -right-2 text-4xl animate-ping"
                style={{ animationDelay: '0.2s' }}
              >
                ✨
              </div>
              <Trophy className="w-24 h-24 mx-auto text-yellow-500 animate-bounce" />
            </div>

            <h2 className="text-3xl font-bold text-[#4a7a2a] mb-2">{t('adventure.awesome')}</h2>
            <p className="text-gray-600 mb-2">
              {level.name} {t('adventure.complete')}
            </p>

            {collectCount > 0 && (
              <div className="flex items-center justify-center gap-2 mb-6">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                <span className="text-xl font-bold text-[#4a7a2a]">
                  {t('adventure.collected')} {collectCount} {t('adventure.stars')}
                </span>
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="py-4 bg-gradient-to-r from-[#5a8a3a] to-[#7dad4c] text-white text-xl font-bold rounded-2xl shadow-lg">
                🎉 {t('classroom.waitingForTeacher')} 🎉
              </div>
              <button
                onClick={resetLevel}
                className="w-full py-3 bg-[#e8f5e0] hover:bg-[#d4ecc8] text-[#4a7a2a] font-medium rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                {t('adventure.tryAgain')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failure Modal */}
      {showFailure && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center animate-[bounceIn_0.5s_ease-out]">
            <div className="text-8xl mb-4">😢</div>

            <h2 className="text-2xl font-bold text-gray-700 mb-2">{t('adventure.notDoneYet')}</h2>
            <p className="text-gray-600 mb-6">{t('adventure.thinkAgain')}</p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <p className="text-amber-700 text-sm">💡 {t('adventure.hint')}</p>
            </div>

            <button
              onClick={resetLevel}
              className="w-full py-4 bg-gradient-to-r from-[#5a8a3a] to-[#7dad4c] text-white text-xl font-bold rounded-2xl hover:opacity-90 shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-6 h-6" />
              {t('adventure.tryAgain')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
