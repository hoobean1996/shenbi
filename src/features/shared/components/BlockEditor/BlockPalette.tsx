/**
 * BlockPalette Component
 *
 * Shows available blocks that can be dragged to the workspace.
 * Filters blocks based on game type and level configuration.
 */

import { useDrag } from 'react-dnd';
import {
  BlockDefinition,
  BlockType,
  CommandId,
  GameType,
  CONTROL_BLOCKS,
  VARIABLE_BLOCKS,
  FUNCTION_BLOCKS,
  LIST_BLOCKS,
  getCommandBlocks,
  createBlock,
} from './types';
import { SoundManager } from '../../../../infrastructure/sounds/SoundManager';
import { useTranslation } from '../../../../infrastructure/i18n';

const ITEM_TYPE = 'BLOCK';

interface PaletteBlockProps {
  definition: BlockDefinition;
  dataTour?: string;
  disabled?: boolean;
}

interface PaletteBlockInternalProps extends PaletteBlockProps {
  language: 'en' | 'zh';
}

function PaletteBlock({
  definition,
  dataTour,
  disabled = false,
  language,
}: PaletteBlockInternalProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => {
      SoundManager.play('dragStart');
      return { block: createBlock(definition), isFromWorkspace: false };
    },
    canDrag: () => !disabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Use correct label based on language
  const label = language === 'en' ? definition.labelEn : definition.label;

  return (
    <div
      ref={drag}
      data-tour={dataTour}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all bg-white border border-gray-200 shadow-sm ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-grab active:cursor-grabbing hover:shadow-md'
      } ${isDragging ? 'opacity-50 scale-95' : disabled ? '' : 'hover:scale-[1.02]'}`}
      style={{ borderLeftWidth: '4px', borderLeftColor: definition.color }}
    >
      <span className="text-lg">{definition.icon}</span>
      <span className="text-gray-800 font-semibold text-sm">{label}</span>
    </div>
  );
}

interface BlockPaletteProps {
  gameType?: GameType;
  availableCommands?: CommandId[];
  availableBlocks?: BlockType[];
  disabled?: boolean;
}

export function BlockPalette({
  gameType = 'maze',
  availableCommands,
  availableBlocks,
  disabled = false,
}: BlockPaletteProps) {
  const { t, language } = useTranslation();

  // Get command blocks for the current game type
  const commandBlocks = getCommandBlocks(gameType);

  // Filter command blocks based on availableCommands (if specified)
  const filteredCommandBlocks = availableCommands
    ? commandBlocks.filter((def) => def.command && availableCommands.includes(def.command))
    : commandBlocks;

  // Filter control blocks based on availableBlocks
  const filteredControlBlocks = availableBlocks
    ? CONTROL_BLOCKS.filter((def) => availableBlocks.includes(def.type))
    : CONTROL_BLOCKS;

  // Filter variable blocks based on availableBlocks
  const filteredVariableBlocks = availableBlocks
    ? VARIABLE_BLOCKS.filter((def) => availableBlocks.includes(def.type))
    : VARIABLE_BLOCKS;

  // Filter function blocks based on availableBlocks
  const filteredFunctionBlocks = availableBlocks
    ? FUNCTION_BLOCKS.filter((def) => availableBlocks.includes(def.type))
    : FUNCTION_BLOCKS;

  // Filter list blocks based on availableBlocks
  const filteredListBlocks = availableBlocks
    ? LIST_BLOCKS.filter((def) => availableBlocks.includes(def.type))
    : LIST_BLOCKS;

  return (
    <div className="flex flex-col gap-4 p-3 bg-gray-100 rounded-xl h-full overflow-auto">
      {/* Command blocks */}
      {filteredCommandBlocks.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-2">{t('blocks.actions')}</h3>
          <div className="space-y-2">
            {filteredCommandBlocks.map((def, index) => (
              <PaletteBlock
                key={`${def.command}-${def.labelEn}`}
                definition={def}
                dataTour={index === 0 ? 'first-block' : undefined}
                disabled={disabled}
                language={language}
              />
            ))}
          </div>
        </div>
      )}

      {/* Control blocks */}
      {filteredControlBlocks.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-2">{t('blocks.control')}</h3>
          <div className="space-y-2">
            {filteredControlBlocks.map((def) => (
              <PaletteBlock
                key={def.type}
                definition={def}
                disabled={disabled}
                language={language}
              />
            ))}
          </div>
        </div>
      )}

      {/* Variable blocks */}
      {filteredVariableBlocks.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-2">{t('blocks.variables')}</h3>
          <div className="space-y-2">
            {filteredVariableBlocks.map((def) => (
              <PaletteBlock
                key={def.type}
                definition={def}
                disabled={disabled}
                language={language}
              />
            ))}
          </div>
        </div>
      )}

      {/* Function blocks */}
      {filteredFunctionBlocks.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-2">{t('blocks.functions')}</h3>
          <div className="space-y-2">
            {filteredFunctionBlocks.map((def) => (
              <PaletteBlock
                key={def.type}
                definition={def}
                disabled={disabled}
                language={language}
              />
            ))}
          </div>
        </div>
      )}

      {/* List blocks */}
      {filteredListBlocks.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-2">
            {language === 'zh' ? '列表' : 'List'}
          </h3>
          <div className="space-y-2">
            {filteredListBlocks.map((def) => (
              <PaletteBlock
                key={def.type}
                definition={def}
                disabled={disabled}
                language={language}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
