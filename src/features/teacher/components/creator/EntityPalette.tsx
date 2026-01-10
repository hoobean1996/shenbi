/**
 * EntityPalette Component
 *
 * Tool selection palette for grid editor.
 */

import { EntityTool, MAZE_TOOLS, ToolDefinition } from './gridUtils';
import { useLanguage } from '../../../../infrastructure/i18n';

interface EntityPaletteProps {
  selectedTool: EntityTool;
  onToolChange: (tool: EntityTool) => void;
}

export function EntityPalette({ selectedTool, onToolChange }: EntityPaletteProps) {
  const { t } = useLanguage();

  // Group tools by category
  const entityTools = MAZE_TOOLS.filter((t) => t.category === 'entity');
  const actionTools = MAZE_TOOLS.filter((t) => t.category === 'action');

  const renderTool = (tool: ToolDefinition) => (
    <button
      key={tool.id}
      onClick={() => onToolChange(tool.id)}
      className={`flex items-center gap-2 p-2.5 rounded-xl transition-all w-full text-left ${
        selectedTool === tool.id
          ? 'bg-[#e8f5e0] ring-2 ring-[#4a7a2a]'
          : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <span className="text-xl w-8 text-center">{tool.icon}</span>
      <span className="text-sm font-medium text-gray-700">{t(tool.labelKey)}</span>
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <h3 className="text-sm font-bold text-gray-600 mb-3">{t('creator.tools')}</h3>

      {/* Entity tools */}
      <div className="space-y-1.5 mb-4">
        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
          {t('creator.place')}
        </div>
        {entityTools.map(renderTool)}
      </div>

      {/* Action tools */}
      <div className="space-y-1.5 pt-3 border-t border-gray-100">
        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
          {t('creator.edit')}
        </div>
        {actionTools.map(renderTool)}
      </div>
    </div>
  );
}
