/**
 * TurtleWorld Standard Library
 *
 * Minimal MiniPython convenience wrappers.
 * Commands and sensors are registered as native commands in TurtleVM.
 */

import { Stdlib, StdlibFunction, buildStdlibString } from '../stdlib-types';

// ============ Color Mappings (exported for TurtleVM) ============

export const TURTLE_COLORS: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
  black: '#000000',
  white: '#ffffff',
  // Chinese color names
  '红': '#ef4444',
  '红色': '#ef4444',
  '蓝': '#3b82f6',
  '蓝色': '#3b82f6',
  '绿': '#22c55e',
  '绿色': '#22c55e',
  '黄': '#eab308',
  '黄色': '#eab308',
  '紫': '#a855f7',
  '紫色': '#a855f7',
  '橙': '#f97316',
  '橙色': '#f97316',
  '黑': '#000000',
  '黑色': '#000000',
  '白': '#ffffff',
  '白色': '#ffffff',
};

// ============ Preamble (empty - no constants needed) ============

const TURTLE_PREAMBLE = `# TurtleWorld Standard Library`;

// ============ Stdlib Functions ============
// Only convenience wrappers that provide extra syntax options

const TURTLE_STDLIB_FUNCTIONS: Record<string, StdlibFunction> = {
  // Convenience wrapper for move("forward", distance) / move("backward", distance) syntax
  move: {
    name: 'move',
    nameZh: '移动',
    description: 'Move in direction by distance',
    descriptionZh: '按方向移动指定距离',
    params: [
      { name: 'direction', nameZh: '方向', type: 'string' },
      { name: 'distance', nameZh: '距离', type: 'number' },
    ],
    category: 'movement',
    code: `def move(direction, distance):
    if direction == 'forward' or direction == '前':
        forward(distance)
    elif direction == 'backward' or direction == '后':
        backward(distance)`,
  },

  // Convenience wrapper for turn("left", degrees) / turn("right", degrees) syntax
  turn: {
    name: 'turn',
    nameZh: '转向',
    description: 'Turn in direction by degrees',
    descriptionZh: '按方向转指定角度',
    params: [
      { name: 'direction', nameZh: '方向', type: 'string' },
      { name: 'degrees', nameZh: '角度', type: 'number' },
    ],
    category: 'movement',
    code: `def turn(direction, degrees):
    if direction == 'left' or direction == '左':
        turnLeft(degrees)
    elif direction == 'right' or direction == '右':
        turnRight(degrees)`,
  },
};

// Chinese aliases for convenience wrappers
const TURTLE_CHINESE_ALIASES = `
# ============ Chinese Aliases ============

def 移动(方向, 距离):
    move(方向, 距离)

def 转向(方向, 角度):
    turn(方向, 角度)`;

// ============ Complete Stdlib ============

const TURTLE_STDLIB_DATA: Stdlib = {
  gameType: 'turtle',
  functions: TURTLE_STDLIB_FUNCTIONS,
  preamble: TURTLE_PREAMBLE,
};

/**
 * Full stdlib string for VM execution
 */
export const TURTLE_STDLIB = buildStdlibString(TURTLE_STDLIB_DATA) + TURTLE_CHINESE_ALIASES;
