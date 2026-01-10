/**
 * Adventure Editor Page
 *
 * Create or edit a custom adventure (metadata and level list).
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useTeacherContent } from '../../../infrastructure/storage';
import type { CustomLevel } from '../../../infrastructure/storage';
import { useLanguage } from '../../../infrastructure/i18n';

// Emoji picker for adventure icons
const ADVENTURE_ICONS = [
  '📚',
  '🐰',
  '🐱',
  '🐶',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🚀',
  '🌟',
  '🎮',
  '🎯',
  '🏰',
  '🌈',
  '🎪',
  '🎨',
  '🔮',
  '💎',
  '🌸',
  '🌺',
  '🍎',
  '🍊',
  '🥕',
  '🌻',
];

export default function AdventureEditorPage() {
  const navigate = useNavigate();
  const { adventureId } = useParams();
  const { t } = useLanguage();
  const { getAdventure, createAdventure, updateAdventure, deleteLevel, reorderLevels, refresh } =
    useTeacherContent();
  const isNew = !adventureId;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [levels, setLevels] = useState<CustomLevel[]>([]);
  const [saving, setSaving] = useState(false);

  // Load existing adventure
  useEffect(() => {
    if (adventureId) {
      const adventure = getAdventure(adventureId);
      if (adventure) {
        setName(adventure.name);
        setDescription(adventure.description || '');
        setIcon(adventure.icon);
        setLevels(adventure.levels);
      }
    }
  }, [adventureId, getAdventure]);

  // Refresh levels when coming back from level editor
  useEffect(() => {
    if (adventureId) {
      refresh().then(() => {
        const adventure = getAdventure(adventureId);
        if (adventure) {
          setLevels(adventure.levels);
        }
      });
    }
  }, [adventureId]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    try {
      if (isNew) {
        const adventure = await createAdventure({
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
        });
        // Navigate to add first level
        navigate(`/t/creator/level/${adventure.id}`);
      } else {
        await updateAdventure(adventureId!, {
          name: name.trim(),
          description: description.trim() || undefined,
          icon,
        });
        navigate('/t/creator');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLevel = async (levelId: string, _levelName: string) => {
    if (!adventureId) return;
    if (confirm(t('creator.deleteConfirm'))) {
      await deleteLevel(adventureId, levelId);
      await refresh();
      const adventure = getAdventure(adventureId);
      if (adventure) {
        setLevels(adventure.levels);
      }
    }
  };

  const handleMoveLevel = async (index: number, direction: 'up' | 'down') => {
    if (!adventureId) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= levels.length) return;

    const newLevelIds = levels.map((l) => l.id);
    [newLevelIds[index], newLevelIds[newIndex]] = [newLevelIds[newIndex], newLevelIds[index]];

    await reorderLevels(adventureId, newLevelIds);
    await refresh();
    const adventure = getAdventure(adventureId);
    if (adventure) {
      setLevels(adventure.levels);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/t/creator')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('creator.backToCreator')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isNew ? t('creator.createAdventure') : t('creator.editAdventure')}
        </h1>

        {/* Adventure Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          {/* Icon Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('creator.icon')}
            </label>
            <div className="flex flex-wrap gap-2">
              {ADVENTURE_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`w-12 h-12 text-2xl rounded-xl flex items-center justify-center transition-all ${
                    icon === emoji
                      ? 'bg-[#e8f5e0] ring-2 ring-[#4a7a2a] scale-110'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('creator.adventureName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('creator.adventureNamePlaceholder')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a7a2a] focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('creator.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('creator.descriptionPlaceholder')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a7a2a] focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Levels Section (only for existing adventures) */}
        {!isNew && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {t('creator.levels')} ({levels.length})
              </h2>
              <button
                onClick={() => navigate(`/t/creator/level/${adventureId}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#4a7a2a] bg-[#e8f5e0] rounded-lg hover:bg-[#d4ebc9] transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('creator.addLevel')}
              </button>
            </div>

            {levels.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <div className="text-4xl mb-2">🎮</div>
                <p>{t('creator.noLevels')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {levels.map((level, index) => (
                  <div
                    key={level.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group"
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveLevel(index, 'up')}
                        disabled={index === 0}
                        className="p-0.5 text-gray-600 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveLevel(index, 'down')}
                        disabled={index === levels.length - 1}
                        className="p-0.5 text-gray-600 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {t('creator.level')} {index + 1}: {level.data.name || t('creator.untitled')}
                      </div>
                      {level.data.description && (
                        <div className="text-sm text-gray-600 truncate">
                          {level.data.description}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/t/creator/level/${adventureId}/${level.id}`)}
                        className="p-2 text-gray-600 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteLevel(level.id, level.data.name || t('creator.untitled'))
                        }
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/t/creator')}
            className="flex-1 py-3 font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 py-3 font-medium text-white bg-[#4a7a2a] rounded-xl hover:bg-[#3a6a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? t('creator.saving')
              : isNew
                ? t('creator.createAndAdd')
                : t('creator.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
}
