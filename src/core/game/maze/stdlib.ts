/**
 * MazeWorld Standard Library
 *
 * MiniPython implementation of maze game commands and sensors.
 * Functions are stored individually for frontend access.
 */

import { Stdlib, StdlibFunction, buildStdlibString } from '../stdlib-types';

// ============ Preamble (constants, not shown in function list) ============

const MAZE_PREAMBLE = `# MazeWorld Standard Library
# Operates on shared 'world' object

# Direction offsets for movement (single-line for parser compatibility)
DIRECTION_OFFSETS = {'up': [0, -1], 'down': [0, 1], 'left': [-1, 0], 'right': [1, 0]}

# Turn mappings
TURN_LEFT = {'up': 'left', 'left': 'down', 'down': 'right', 'right': 'up'}
TURN_RIGHT = {'up': 'right', 'right': 'down', 'down': 'left', 'left': 'up'}`;

// ============ Stdlib Functions ============

const MAZE_STDLIB_FUNCTIONS: Record<string, StdlibFunction> = {
  // Helper functions
  getCell: {
    name: 'getCell',
    nameZh: '获取格子',
    description: 'Get cell type at position (returns "wall" for out of bounds)',
    descriptionZh: '获取指定位置的格子类型（越界返回"wall"）',
    params: [
      { name: 'x', nameZh: 'x坐标', type: 'number' },
      { name: 'y', nameZh: 'y坐标', type: 'number' },
    ],
    returns: 'string',
    category: 'helper',
    code: `def getCell(x, y):
    if x < 0 or y < 0:
        return 'wall'
    if y >= world.height or x >= world.width:
        return 'wall'
    return world.grid[y][x]`,
  },

  autoCollect: {
    name: 'autoCollect',
    nameZh: '自动收集',
    description: 'Auto-collect star at current position',
    descriptionZh: '自动收集当前位置的星星',
    category: 'helper',
    code: `def autoCollect():
    cell = getCell(world.x, world.y)
    if cell == 'star':
        world.grid[world.y][world.x] = 'empty'
        world.collected = world.collected + 1`,
  },

  // Movement commands
  forward: {
    name: 'forward',
    nameZh: '前进',
    description: 'Move player forward one cell in current direction',
    descriptionZh: '向当前方向前进一格',
    returns: 'boolean',
    category: 'movement',
    code: `def forward():
    offset = DIRECTION_OFFSETS[world.direction]
    newX = world.x + offset[0]
    newY = world.y + offset[1]
    if getCell(newX, newY) == 'wall':
        return False
    _forward()
    return True`,
  },

  backward: {
    name: 'backward',
    nameZh: '后退',
    description: 'Move player backward one cell',
    descriptionZh: '向后退一格',
    returns: 'boolean',
    category: 'movement',
    code: `def backward():
    offset = DIRECTION_OFFSETS[world.direction]
    newX = world.x - offset[0]
    newY = world.y - offset[1]
    if getCell(newX, newY) == 'wall':
        return False
    _backward()
    return True`,
  },

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

  // Rotation commands
  turnLeft: {
    name: 'turnLeft',
    nameZh: '左转',
    description: 'Turn player left (counter-clockwise)',
    descriptionZh: '向左转（逆时针）',
    category: 'movement',
    code: `def turnLeft():
    _turnLeft()`,
  },

  turnRight: {
    name: 'turnRight',
    nameZh: '右转',
    description: 'Turn player right (clockwise)',
    descriptionZh: '向右转（顺时针）',
    category: 'movement',
    code: `def turnRight():
    _turnRight()`,
  },

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

  // Collection commands
  collect: {
    name: 'collect',
    nameZh: '收集',
    description: 'Collect item at current position',
    descriptionZh: '收集当前位置的物品',
    returns: 'boolean',
    category: 'action',
    code: `def collect():
    cell = getCell(world.x, world.y)
    if cell == 'star':
        _collect()
        return True
    return False`,
  },

  // Sensors
  frontBlocked: {
    name: 'frontBlocked',
    nameZh: '前方有墙',
    description: 'Check if there is a wall in front',
    descriptionZh: '检查前方是否有墙',
    returns: 'boolean',
    category: 'sensor',
    code: `def frontBlocked():
    offset = DIRECTION_OFFSETS[world.direction]
    frontX = world.x + offset[0]
    frontY = world.y + offset[1]
    return getCell(frontX, frontY) == 'wall'`,
  },

  frontClear: {
    name: 'frontClear',
    nameZh: '前方无墙',
    description: 'Check if front is clear (not blocked)',
    descriptionZh: '检查前方是否畅通',
    returns: 'boolean',
    category: 'sensor',
    code: `def frontClear():
    return not frontBlocked()`,
  },

  atGoal: {
    name: 'atGoal',
    nameZh: '到达终点',
    description: 'Check if player is at goal',
    descriptionZh: '检查是否到达终点',
    returns: 'boolean',
    category: 'sensor',
    code: `def atGoal():
    return getCell(world.x, world.y) == 'goal'`,
  },

  hasStar: {
    name: 'hasStar',
    nameZh: '有星星',
    description: 'Check if there is a star at current position',
    descriptionZh: '检查当前位置是否有星星',
    returns: 'boolean',
    category: 'sensor',
    code: `def hasStar():
    return getCell(world.x, world.y) == 'star'`,
  },

  remainingStars: {
    name: 'remainingStars',
    nameZh: '剩余星星',
    description: 'Get number of stars remaining in maze',
    descriptionZh: '获取迷宫中剩余的星星数量',
    returns: 'number',
    category: 'sensor',
    code: `def remainingStars():
    count = 0
    for row in world.grid:
        for cell in row:
            if cell == 'star':
                count = count + 1
    return count`,
  },

  collectedCount: {
    name: 'collectedCount',
    nameZh: '已收集',
    description: 'Get total stars collected',
    descriptionZh: '获取已收集的星星数量',
    returns: 'number',
    category: 'sensor',
    code: `def collectedCount():
    return world.collected`,
  },

  stepCount: {
    name: 'stepCount',
    nameZh: '步数',
    description: 'Get total steps taken',
    descriptionZh: '获取已执行的步数',
    returns: 'number',
    category: 'sensor',
    code: `def stepCount():
    return world.steps`,
  },
};

// Chinese aliases (these wrap the English functions)
const MAZE_CHINESE_ALIASES = `
# ============ Chinese Aliases ============

def 前进():
    return forward()

def 后退():
    return backward()

def 移动(方向):
    return move(方向)

def 左转():
    turnLeft()

def 右转():
    turnRight()

def 转向(方向):
    turn(方向)

def 收集():
    return collect()

def 前方有墙():
    return frontBlocked()

def 前方无墙():
    return frontClear()

def 到达终点():
    return atGoal()

def 有星星():
    return hasStar()

def 剩余星星():
    return remainingStars()

def 已收集():
    return collectedCount()`;

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
