/**
 * Level Picker Component
 *
 * Allows selecting levels from an adventure for an assignment.
 */

import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { adventureApi, LevelResponse, ApiError } from '../../../../infrastructure/services/api';

interface LevelPickerProps {
  adventureId: number;
  selectedLevelIds: number[];
  onSelectionChange: (levelIds: number[]) => void;
}

export default function LevelPicker({
  adventureId,
  selectedLevelIds,
  onSelectionChange,
}: LevelPickerProps) {
  const [levels, setLevels] = useState<LevelResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLevels() {
      try {
        setLoading(true);
        setError(null);
        const adventure = await adventureApi.get(adventureId);
        setLevels(adventure.levels || []);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.detail || err.message);
        } else {
          setError('Failed to load levels');
        }
      } finally {
        setLoading(false);
      }
    }
    loadLevels();
  }, [adventureId]);

  const toggleLevel = (levelId: number) => {
    if (selectedLevelIds.includes(levelId)) {
      onSelectionChange(selectedLevelIds.filter((id) => id !== levelId));
    } else {
      onSelectionChange([...selectedLevelIds, levelId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(levels.map((l) => l.id));
  };

  const selectNone = () => {
    onSelectionChange([]);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading levels...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
      </div>
    );
  }

  if (levels.length === 0) {
    return <div className="text-gray-500 py-4">This adventure has no levels.</div>;
  }

  const allSelected = selectedLevelIds.length === levels.length;
  const noneSelected = selectedLevelIds.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Levels * ({selectedLevelIds.length} of {levels.length} selected)
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={allSelected}
            className="text-xs text-[#4a7a2a] hover:underline disabled:opacity-50 disabled:no-underline"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={selectNone}
            disabled={noneSelected}
            className="text-xs text-gray-600 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
        {levels.map((level, index) => {
          const isSelected = selectedLevelIds.includes(level.id);
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => toggleLevel(level.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                index > 0 ? 'border-t border-gray-100' : ''
              } ${isSelected ? 'bg-green-50' : ''}`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center ${
                  isSelected ? 'bg-[#4a7a2a] text-white' : 'border-2 border-gray-300'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">
                  {index + 1}. {level.name}
                </div>
                {level.description && (
                  <div className="text-xs text-gray-500 truncate">{level.description}</div>
                )}
              </div>
              {level.required_tier === 'premium' && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  Premium
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
