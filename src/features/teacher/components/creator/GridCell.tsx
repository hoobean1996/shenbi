/**
 * GridCell Component
 *
 * A single cell in the grid editor.
 */

import { getSymbolDisplay, PLAYER_SYMBOLS } from './gridUtils';

interface GridCellProps {
  value: string;
  x: number;
  y: number;
  isEdge: boolean;
  onMouseDown: () => void;
  onMouseEnter: () => void;
}

export function GridCell({
  value,
  x: _x,
  y: _y,
  isEdge: _isEdge,
  onMouseDown,
  onMouseEnter,
}: GridCellProps) {
  const { emoji } = getSymbolDisplay(value);

  // Determine background color based on cell type
  const getBgColor = () => {
    if (value === '#') return 'bg-gray-700';
    if (value === 'G') return 'bg-green-200';
    if (PLAYER_SYMBOLS.includes(value)) return 'bg-blue-100';
    if (value === '*') return 'bg-yellow-100';
    return 'bg-gray-100';
  };

  // Get rotation for player direction indicator
  const getPlayerRotation = () => {
    switch (value) {
      case '>':
        return 'rotate-0';
      case '<':
        return 'rotate-180';
      case '^':
        return '-rotate-90';
      case 'v':
        return 'rotate-90';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        w-10 h-10 flex items-center justify-center text-xl
        rounded-md cursor-pointer select-none transition-all
        ${getBgColor()}
        hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50
        active:scale-95
      `}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      {PLAYER_SYMBOLS.includes(value) ? (
        <span className={`transform ${getPlayerRotation()}`}>{emoji}</span>
      ) : (
        emoji
      )}
    </div>
  );
}
