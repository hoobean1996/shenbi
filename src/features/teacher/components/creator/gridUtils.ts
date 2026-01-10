/**
 * Grid Utility Functions for Level Creator
 *
 * Handles grid manipulation, entity placement, and validation.
 */

import type { TranslationKey } from '../../../../infrastructure/i18n';

export type EntityTool =
  | 'wall'
  | 'star'
  | 'goal'
  | 'player-right'
  | 'player-left'
  | 'player-up'
  | 'player-down'
  | 'empty'
  | 'eraser';

export const TOOL_SYMBOLS: Record<EntityTool, string> = {
  wall: '#',
  star: '*',
  goal: 'G',
  'player-right': '>',
  'player-left': '<',
  'player-up': '^',
  'player-down': 'v',
  empty: '.',
  eraser: '.',
};

export const PLAYER_SYMBOLS = ['>', '<', '^', 'v'];

export interface ToolDefinition {
  id: EntityTool;
  icon: string;
  labelKey: TranslationKey;
  category: 'entity' | 'action';
}

export const MAZE_TOOLS: ToolDefinition[] = [
  { id: 'player-right', icon: '🐰', labelKey: 'creator.toolPlayer', category: 'entity' },
  { id: 'wall', icon: '🧱', labelKey: 'creator.toolWall', category: 'entity' },
  { id: 'star', icon: '🥕', labelKey: 'creator.toolStar', category: 'entity' },
  { id: 'goal', icon: '🏠', labelKey: 'creator.toolGoal', category: 'entity' },
  { id: 'empty', icon: '⬜', labelKey: 'creator.toolEmpty', category: 'action' },
  { id: 'eraser', icon: '🧹', labelKey: 'creator.toolEraser', category: 'action' },
];

/**
 * Create an empty grid with walls on the borders
 */
export function createEmptyGrid(width: number, height: number): string[] {
  const grid: string[] = [];
  for (let y = 0; y < height; y++) {
    if (y === 0 || y === height - 1) {
      // Top and bottom walls
      grid.push('#'.repeat(width));
    } else {
      // Side walls with empty interior
      grid.push('#' + '.'.repeat(width - 2) + '#');
    }
  }
  return grid;
}

/**
 * Parse grid string array to 2D matrix
 */
export function parseGridToMatrix(grid: string[], width: number, height: number): string[][] {
  const matrix: string[][] = [];
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      row.push(grid[y]?.[x] || '.');
    }
    matrix.push(row);
  }
  return matrix;
}

/**
 * Convert 2D matrix back to grid string array
 */
export function matrixToGridStrings(matrix: string[][]): string[] {
  return matrix.map((row) => row.join(''));
}

/**
 * Place an entity on the grid
 */
export function placeEntity(
  matrix: string[][],
  x: number,
  y: number,
  tool: EntityTool
): string[][] {
  const newMatrix = matrix.map((row) => [...row]);
  const symbol = TOOL_SYMBOLS[tool];

  // If placing a player, remove existing player first (only one player allowed)
  if (tool.startsWith('player-')) {
    for (let py = 0; py < newMatrix.length; py++) {
      for (let px = 0; px < newMatrix[py].length; px++) {
        if (PLAYER_SYMBOLS.includes(newMatrix[py][px])) {
          newMatrix[py][px] = '.';
        }
      }
    }
  }

  // If placing goal, remove existing goal first (only one goal allowed)
  if (tool === 'goal') {
    for (let py = 0; py < newMatrix.length; py++) {
      for (let px = 0; px < newMatrix[py].length; px++) {
        if (newMatrix[py][px] === 'G') {
          newMatrix[py][px] = '.';
        }
      }
    }
  }

  newMatrix[y][x] = symbol;
  return newMatrix;
}

/**
 * Resize grid while preserving existing content
 */
export function resizeGrid(currentGrid: string[], newWidth: number, newHeight: number): string[] {
  const newGrid: string[] = [];

  for (let y = 0; y < newHeight; y++) {
    let row = '';
    for (let x = 0; x < newWidth; x++) {
      // Border cells are always walls
      if (y === 0 || y === newHeight - 1 || x === 0 || x === newWidth - 1) {
        row += '#';
      } else if (currentGrid[y] && currentGrid[y][x]) {
        // Preserve existing content if within bounds and not on border
        const existing = currentGrid[y][x];
        row +=
          existing === '#' &&
          (y === 0 ||
            y === currentGrid.length - 1 ||
            x === 0 ||
            x === (currentGrid[0]?.length || 0) - 1)
            ? '.'
            : existing;
      } else {
        row += '.';
      }
    }
    newGrid.push(row);
  }

  return newGrid;
}

/**
 * Validate level grid
 */
export function validateGrid(grid: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for player
  const hasPlayer = grid.some((row) => PLAYER_SYMBOLS.some((s) => row.includes(s)));
  if (!hasPlayer) {
    errors.push('Level must have a player start position');
  }

  // Check for goal
  const hasGoal = grid.some((row) => row.includes('G'));
  if (!hasGoal) {
    errors.push('Level must have a goal');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get symbol display info
 */
export function getSymbolDisplay(symbol: string): { emoji: string; label: string } {
  switch (symbol) {
    case '#':
      return { emoji: '🧱', label: 'Wall' };
    case '*':
      return { emoji: '🥕', label: 'Star' };
    case 'G':
      return { emoji: '🏠', label: 'Goal' };
    case '>':
      return { emoji: '🐰', label: 'Player →' };
    case '<':
      return { emoji: '🐰', label: 'Player ←' };
    case '^':
      return { emoji: '🐰', label: 'Player ↑' };
    case 'v':
      return { emoji: '🐰', label: 'Player ↓' };
    case '.':
    case ' ':
    default:
      return { emoji: '', label: 'Empty' };
  }
}
