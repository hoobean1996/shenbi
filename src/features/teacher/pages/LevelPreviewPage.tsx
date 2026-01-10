/**
 * Level Preview Page
 *
 * Test play a level before saving.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useTeacherContent } from '../../../infrastructure/storage';
import { parseLevel } from '../../../infrastructure/levels/loader';
import { MazeAdventure } from '../../student/components/adventures';
import type { LevelDefinition } from '../../../core/engine/types';
import type { CompactLevelData } from '../../../infrastructure/levels/types';
import { bunnyTheme } from '../../../infrastructure/themes/themes';
import { useLanguage } from '../../../infrastructure/i18n';
import { error as logError } from '../../../infrastructure/logging';

export default function LevelPreviewPage() {
  const navigate = useNavigate();
  const { adventureId, levelIndex } = useParams();
  const { getAdventure } = useTeacherContent();
  const { t } = useLanguage();

  const [level, setLevel] = useState<LevelDefinition | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'fail'; text: string } | null>(null);

  // Use bunny theme as default for creator levels
  const theme = bunnyTheme;

  // Load level
  useEffect(() => {
    if (levelIndex === 'temp') {
      // Load from session storage (preview before save)
      const previewData = sessionStorage.getItem('preview_level');
      if (previewData) {
        try {
          const compactLevel = JSON.parse(previewData) as CompactLevelData;
          const parsed = parseLevel(compactLevel);
          setLevel(parsed);
        } catch (e) {
          logError('Failed to parse preview level', e, undefined, 'LevelPreviewPage');
        }
      }
    } else {
      // Load from saved adventure
      const adventure = getAdventure(adventureId || '');
      const idx = parseInt(levelIndex || '0', 10);
      if (adventure && adventure.levels[idx]) {
        const parsed = parseLevel(adventure.levels[idx].data);
        setLevel(parsed);
      }
    }
  }, [adventureId, levelIndex, getAdventure]);

  const handleComplete = (stars: number) => {
    setMessage({
      type: 'success',
      text: `${t('creator.levelComplete')} ${t('adventure.collected')} ${stars} ${t('adventure.stars')}`,
    });
  };

  const handleFail = () => {
    setMessage({
      type: 'fail',
      text: t('creator.levelFailed'),
    });
  };

  const handleReset = () => {
    setResetKey((k) => k + 1);
    setMessage(null);
  };

  if (!level) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('creator.backToEditor')}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t('adventure.reset')}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <p className="text-sm text-amber-700 text-center">
            <strong>{t('creator.previewMode')}:</strong> {t('creator.previewModeDesc')}
          </p>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`border-b ${
            message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 py-3">
            <p
              className={`text-sm text-center font-medium ${
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {message.text}
              <button onClick={handleReset} className="ml-3 underline hover:no-underline">
                {t('creator.tryAgain')}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">{level.name || t('nav.preview')}</h1>
          {level.description && (
            <p className="text-gray-600 mb-6 text-center max-w-md">{level.description}</p>
          )}

          <MazeAdventure
            level={level}
            theme={theme}
            resetKey={resetKey}
            isLargeScreen={true}
            onComplete={handleComplete}
            onFail={handleFail}
            onCodeChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
