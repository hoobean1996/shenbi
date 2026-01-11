/**
 * MazeWorld Standard Library
 *
 * Minimal MiniPython convenience wrappers.
 * Commands and sensors are registered as native commands in MazeVM.
 */

import { Stdlib, StdlibFunction, buildStdlibString } from '../stdlib-types';

// ============ Preamble (empty - no constants needed) ============

const MAZE_PREAMBLE = `# MazeWorld Standard Library`;

// ============ Stdlib Functions ============
// Only convenience wrappers that provide extra syntax options

const MAZE_STDLIB_FUNCTIONS: Record<string, StdlibFunction> = {
  // Convenience wrapper for move("forward") / move("backward") syntax
  move: {
    name: 'move',
    nameZh: '移动',
    description: 'Move in specified direction ("forward" or "backward")',
    descriptionZh: '按指定方向移动（"forward"或"backward"）',
    params: [{ name: 'direction', nameZh: '方向', type: 'string' }],
    returns: 'boolean',
    category: 'movement',
    code: `def move(direction):
    if direction == 'forward' or direction == '前':
        return forward()
    if direction == 'backward' or direction == '后':
        return backward()
    return False`,
  },

  // Convenience wrapper for turn("left") / turn("right") syntax
  turn: {
    name: 'turn',
    nameZh: '转向',
    description: 'Turn in specified direction ("left" or "right")',
    descriptionZh: '按指定方向转向（"left"或"right"）',
    params: [{ name: 'direction', nameZh: '方向', type: 'string' }],
    category: 'movement',
    code: `def turn(direction):
    if direction == 'left' or direction == '左':
        turnLeft()
    elif direction == 'right' or direction == '右':
        turnRight()`,
  },
};

// Chinese aliases for convenience wrappers
const MAZE_CHINESE_ALIASES = `
# ============ Chinese Aliases ============

def 移动(方向):
    return move(方向)

def 转向(方向):
    turn(方向)`;

// ============ Complete Stdlib ============

const MAZE_STDLIB_DATA: Stdlib = {
  gameType: 'maze',
  functions: MAZE_STDLIB_FUNCTIONS,
  preamble: MAZE_PREAMBLE,
};

/**
 * Full stdlib string for VM execution
 * (backward compatible with existing code)
 */
export const MAZE_STDLIB = buildStdlibString(MAZE_STDLIB_DATA) + MAZE_CHINESE_ALIASES;

/**
 * Shared world state type
 * This is the object that TypeScript creates and MiniPython modifies
 */
export interface MazeWorldState {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  collected: number;
  steps: number;
  grid: string[][];
  width: number;
  height: number;
}

/**
 * Create initial world state from grid strings
 */
export function createWorldState(gridStrings: string[]): MazeWorldState {
  const height = gridStrings.length;
  const width = gridStrings[0]?.length ?? 0;

  // Character mappings
  const charToCell: Record<string, string> = {
    '#': 'wall',
    '.': 'empty',
    '*': 'star',
    G: 'goal',
    '>': 'empty',
    '<': 'empty',
    '^': 'empty',
    v: 'empty',
  };

  const charToDirection: Record<string, 'up' | 'down' | 'left' | 'right'> = {
    '>': 'right',
    '<': 'left',
    '^': 'up',
    v: 'down',
  };

  let playerX = 0;
  let playerY = 0;
  let playerDirection: 'up' | 'down' | 'left' | 'right' = 'right';

  const grid: string[][] = [];

  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    const line = gridStrings[y];

    for (let x = 0; x < width; x++) {
      const char = line[x] || '.';
      const cellType = charToCell[char] ?? 'empty';
      row.push(cellType);

      // Check for player position
      if (charToDirection[char]) {
        playerX = x;
        playerY = y;
        playerDirection = charToDirection[char];
      }
    }
    grid.push(row);
  }

  return {
    x: playerX,
    y: playerY,
    direction: playerDirection,
    collected: 0,
    steps: 0,
    grid,
    width,
    height,
  };
}
