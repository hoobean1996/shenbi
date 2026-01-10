/**
 * Level Editor Page
 *
 * Visual grid editor for creating and editing maze levels.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Save, RotateCcw } from 'lucide-react';
import { useTeacherContent } from '../../../infrastructure/storage';
import {
  GridEditor,
  EntityPalette,
  EntityTool,
  createEmptyGrid,
  resizeGrid,
  validateGrid,
} from '../components/creator';
import type { CompactLevelData } from '../../../infrastructure/levels/types';
import { useLanguage, type TranslationKey } from '../../../infrastructure/i18n';

// Preset grid sizes
const GRID_SIZES = [
  { label: '5×5', width: 5, height: 5 },
  { label: '7×7', width: 7, height: 7 },
  { label: '9×9', width: 9, height: 9 },
  { label: '11×11', width: 11, height: 11 },
];

// Available block options (translation keys)
const BLOCK_OPTIONS: Array<{ id: string; labelKey: TranslationKey; descKey: TranslationKey }> = [
  { id: 'command', labelKey: 'creator.blockCommand', descKey: 'creator.blockCommandDesc' },
  { id: 'repeat', labelKey: 'creator.blockRepeat', descKey: 'creator.blockRepeatDesc' },
  { id: 'if', labelKey: 'creator.blockIf', descKey: 'creator.blockIfDesc' },
  { id: 'if_else', labelKey: 'creator.blockIfElse', descKey: 'creator.blockIfElseDesc' },
  { id: 'while', labelKey: 'creator.blockWhile', descKey: 'creator.blockWhileDesc' },
];

export default function LevelEditorPage() {
  const navigate = useNavigate();
  const { adventureId, levelId } = useParams();
  const { t } = useLanguage();
  const { getAdventure, addLevel, updateLevel } = useTeacherContent();

  const isNew = !levelId;
  const adventure = getAdventure(adventureId || '');

  // Grid state
  const [gridWidth, setGridWidth] = useState(7);
  const [gridHeight, setGridHeight] = useState(7);
  const [grid, setGrid] = useState<string[]>(() => createEmptyGrid(7, 7));
  const [selectedTool, setSelectedTool] = useState<EntityTool>('wall');

  // Metadata state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>(['command']);
  const [hints, setHints] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load existing level if editing
  useEffect(() => {
    if (levelId && adventure) {
      const level = adventure.levels.find((l) => l.id === levelId);
      if (level) {
        setName(level.data.name || '');
        setDescription(level.data.description || '');
        setSelectedBlocks(level.data.availableBlocks || ['command']);
        setHints(level.data.hints || []);
        if (level.data.grid) {
          setGrid(level.data.grid);
          setGridHeight(level.data.grid.length);
          setGridWidth(Math.max(...level.data.grid.map((r) => r.length)));
        }
      }
    }
  }, [levelId, adventure]);

  // Handle grid size change
  const handleSizeChange = (width: number, height: number) => {
    setGridWidth(width);
    setGridHeight(height);
    setGrid((prev) => resizeGrid(prev, width, height));
  };

  // Reset grid to empty
  const handleReset = () => {
    if (confirm(t('creator.resetConfirm'))) {
      setGrid(createEmptyGrid(gridWidth, gridHeight));
    }
  };

  // Toggle block selection
  const toggleBlock = (blockId: string) => {
    setSelectedBlocks((prev) =>
      prev.includes(blockId) ? prev.filter((b) => b !== blockId) : [...prev, blockId]
    );
  };

  // Add hint
  const addHint = () => {
    setHints((prev) => [...prev, '']);
  };

  // Update hint
  const updateHint = (index: number, value: string) => {
    setHints((prev) => prev.map((h, i) => (i === index ? value : h)));
  };

  // Remove hint
  const removeHint = (index: number) => {
    setHints((prev) => prev.filter((_, i) => i !== index));
  };

  // Preview level
  const handlePreview = () => {
    const validation = validateGrid(grid);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Store level in session storage for preview
    const levelData: CompactLevelData = {
      id: levelId || 'preview',
      name: name || 'Preview Level',
      description,
      grid,
      gameType: 'maze',
      availableBlocks: selectedBlocks,
      availableCommands: ['forward', 'turnLeft', 'turnRight', 'collect'],
      availableSensors: ['frontBlocked', 'hasStar', 'atGoal'],
      hints: hints.filter((h) => h.trim()),
      winCondition: 'remainingStars == 0 and atGoal()',
    };

    sessionStorage.setItem('preview_level', JSON.stringify(levelData));
    navigate(`/t/creator/preview/${adventureId}/temp`);
  };

  // Save level
  const handleSave = async () => {
    const validation = validateGrid(grid);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    if (!adventureId) return;
    setSaving(true);
    setValidationErrors([]);

    try {
      const levelData: CompactLevelData = {
        id: levelId || '',
        name: name || `Level ${(adventure?.levels.length || 0) + 1}`,
        description,
        grid,
        gameType: 'maze',
        availableBlocks: selectedBlocks,
        availableCommands: ['forward', 'turnLeft', 'turnRight', 'collect'],
        availableSensors: ['frontBlocked', 'hasStar', 'atGoal'],
        hints: hints.filter((h) => h.trim()),
        winCondition: 'remainingStars == 0 and atGoal()',
      };

      if (isNew) {
        await addLevel(adventureId, levelData);
      } else {
        await updateLevel(adventureId, levelId!, levelData);
      }

      navigate(`/t/creator/adventure/${adventureId}`);
    } finally {
      setSaving(false);
    }
  };

  if (!adventure) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">{t('creator.adventureNotFound')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/t/creator/adventure/${adventureId}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('creator.backTo')} {adventure.name}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreview}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Play className="w-4 h-4" />
                {t('creator.preview')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#4a7a2a] rounded-lg hover:bg-[#3a6a1a] transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? t('creator.saving') : t('creator.save')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="font-medium text-red-700 mb-1">{t('creator.validationError')}</div>
            <ul className="list-disc list-inside text-red-600 text-sm">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left: Tool Palette */}
          <div className="w-56 flex-shrink-0 space-y-4">
            <EntityPalette selectedTool={selectedTool} onToolChange={setSelectedTool} />

            {/* Grid Size */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-600 mb-3">{t('creator.gridSize')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {GRID_SIZES.map((size) => (
                  <button
                    key={size.label}
                    onClick={() => handleSizeChange(size.width, size.height)}
                    className={`py-2 text-sm font-medium rounded-lg transition-all ${
                      gridWidth === size.width && gridHeight === size.height
                        ? 'bg-[#e8f5e0] text-[#4a7a2a] ring-2 ring-[#4a7a2a]'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleReset}
                className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {t('creator.resetGrid')}
              </button>
            </div>
          </div>

          {/* Center: Grid Editor */}
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-lg font-bold text-gray-800 mb-4">
              {isNew
                ? t('creator.createLevel')
                : `${t('creator.editLevel')}: ${name || t('creator.level')}`}
            </h1>
            <GridEditor
              width={gridWidth}
              height={gridHeight}
              grid={grid}
              onChange={setGrid}
              selectedTool={selectedTool}
            />
            <p className="mt-3 text-sm text-gray-600">{t('creator.borderNote')}</p>
          </div>

          {/* Right: Level Settings */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-600 mb-3">{t('creator.levelInfo')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('creator.levelName')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('creator.levelNamePlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a7a2a] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('creator.instructions')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('creator.instructionsPlaceholder')}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a7a2a] focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Available Blocks */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-600 mb-3">
                {t('creator.availableBlocks')}
              </h3>
              <div className="space-y-2">
                {BLOCK_OPTIONS.map((block) => (
                  <label key={block.id} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBlocks.includes(block.id)}
                      onChange={() => toggleBlock(block.id)}
                      className="mt-1 rounded border-gray-300 text-[#4a7a2a] focus:ring-[#4a7a2a]"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">{t(block.labelKey)}</div>
                      <div className="text-xs text-gray-600">{t(block.descKey)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Hints */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-600">{t('creator.hints')}</h3>
                <button
                  onClick={addHint}
                  className="text-xs font-medium text-[#4a7a2a] hover:underline"
                >
                  + {t('creator.addHint')}
                </button>
              </div>
              {hints.length === 0 ? (
                <p className="text-xs text-gray-600">{t('creator.noHints')}</p>
              ) : (
                <div className="space-y-2">
                  {hints.map((hint, index) => (
                    <div key={index} className="flex gap-1">
                      <input
                        type="text"
                        value={hint}
                        onChange={(e) => updateHint(index, e.target.value)}
                        placeholder={`${t('creator.hint')} ${index + 1}`}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4a7a2a]"
                      />
                      <button
                        onClick={() => removeHint(index)}
                        className="px-2 text-gray-600 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
