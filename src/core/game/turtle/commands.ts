/**
 * Turtle Game Commands
 *
 * Single source of truth for turtle commands and conditions.
 * Used by: TurtleVM (registration), BlockEditor (UI), CodeGenerator (code output)
 */

import { TurtleWorld } from './TurtleWorld';
import { Value } from '../../lang/ir';

// ============ Types ============

export type ArgType = 'none' | 'number' | 'string';

export interface CommandDefinition {
  /** Unique command ID */
  id: string;
  /** Display label in Chinese */
  label: string;
  /** Display label in English */
  labelEn: string;
  /** Icon for block UI */
  icon: string;
  /** Block color (hex) */
  color: string;
  /** Code name to emit (e.g., 'forward') */
  codeName: string;
  /** Chinese code alias */
  codeNameZh: string;
  /** Argument type */
  argType: ArgType;
  /** Default argument value */
  defaultArg?: number | string;
  /** Handler function */
  handler: (world: TurtleWorld, args: Value[]) => Value | void;
}

export interface ConditionDefinition {
  /** Unique condition ID */
  id: string;
  /** Display label in Chinese */
  label: string;
  /** Display label in English */
  labelEn: string;
  /** Code name to emit */
  codeName: string;
  /** Chinese code alias */
  codeNameZh: string;
  /** Handler function - returns boolean */
  handler: (world: TurtleWorld) => boolean;
}

// ============ Colors ============

export const TURTLE_COLORS = {
  action: '#3B82F6', // Blue - movement commands
  pen: '#8B5CF6', // Purple - pen commands
  sensor: '#10B981', // Green - conditions/sensors
} as const;

// Color name to hex mappings for setColor command
export const COLOR_MAP: Record<string, string> = {
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

// ============ Commands ============

export const TURTLE_COMMANDS: CommandDefinition[] = [
  // Movement commands
  {
    id: 'forward',
    label: '前进',
    labelEn: 'Forward',
    icon: '⬆️',
    color: TURTLE_COLORS.action,
    codeName: 'forward',
    codeNameZh: '前进',
    argType: 'number',
    defaultArg: 50,
    handler: (world, args) => {
      const distance = typeof args[0] === 'number' ? args[0] : 50;
      world.forward(distance);
    },
  },
  {
    id: 'backward',
    label: '后退',
    labelEn: 'Backward',
    icon: '⬇️',
    color: TURTLE_COLORS.action,
    codeName: 'backward',
    codeNameZh: '后退',
    argType: 'number',
    defaultArg: 50,
    handler: (world, args) => {
      const distance = typeof args[0] === 'number' ? args[0] : 50;
      world.backward(distance);
    },
  },
  {
    id: 'turnLeft',
    label: '左转',
    labelEn: 'Turn Left',
    icon: '↩️',
    color: TURTLE_COLORS.action,
    codeName: 'turnLeft',
    codeNameZh: '左转',
    argType: 'number',
    defaultArg: 90,
    handler: (world, args) => {
      const degrees = typeof args[0] === 'number' ? args[0] : 90;
      world.turnLeft(degrees);
    },
  },
  {
    id: 'turnRight',
    label: '右转',
    labelEn: 'Turn Right',
    icon: '↪️',
    color: TURTLE_COLORS.action,
    codeName: 'turnRight',
    codeNameZh: '右转',
    argType: 'number',
    defaultArg: 90,
    handler: (world, args) => {
      const degrees = typeof args[0] === 'number' ? args[0] : 90;
      world.turnRight(degrees);
    },
  },
  // Pen commands
  {
    id: 'penUp',
    label: '抬笔',
    labelEn: 'Pen Up',
    icon: '✏️',
    color: TURTLE_COLORS.pen,
    codeName: 'penUp',
    codeNameZh: '抬笔',
    argType: 'none',
    handler: (world) => world.penUp(),
  },
  {
    id: 'penDown',
    label: '落笔',
    labelEn: 'Pen Down',
    icon: '🖊️',
    color: TURTLE_COLORS.pen,
    codeName: 'penDown',
    codeNameZh: '落笔',
    argType: 'none',
    handler: (world) => world.penDown(),
  },
  {
    id: 'setColor',
    label: '设置颜色',
    labelEn: 'Set Color',
    icon: '🎨',
    color: TURTLE_COLORS.pen,
    codeName: 'setColor',
    codeNameZh: '设置颜色',
    argType: 'string',
    defaultArg: 'red',
    handler: (world, args) => {
      const color = typeof args[0] === 'string' ? args[0] : '#000000';
      const mappedColor = COLOR_MAP[color] || color;
      world.setColor(mappedColor);
    },
  },
  {
    id: 'setWidth',
    label: '设置宽度',
    labelEn: 'Set Width',
    icon: '📏',
    color: TURTLE_COLORS.pen,
    codeName: 'setWidth',
    codeNameZh: '设置宽度',
    argType: 'number',
    defaultArg: 2,
    handler: (world, args) => {
      const width = typeof args[0] === 'number' ? args[0] : 2;
      world.setWidth(width);
    },
  },
];

// ============ Conditions ============
// Turtle doesn't have game conditions like maze, but has sensors

export const TURTLE_CONDITIONS: ConditionDefinition[] = [];

// ============ Sensors ============

export const TURTLE_SENSORS: CommandDefinition[] = [
  {
    id: 'isPenDown',
    label: '画笔落下',
    labelEn: 'Is Pen Down',
    icon: '❓',
    color: TURTLE_COLORS.sensor,
    codeName: 'isPenDown',
    codeNameZh: '画笔落下',
    argType: 'none',
    handler: (world) => world.isPenDown(),
  },
  {
    id: 'getX',
    label: '获取X',
    labelEn: 'Get X',
    icon: '📍',
    color: TURTLE_COLORS.sensor,
    codeName: 'getX',
    codeNameZh: '获取X',
    argType: 'none',
    handler: (world) => world.getX(),
  },
  {
    id: 'getY',
    label: '获取Y',
    labelEn: 'Get Y',
    icon: '📍',
    color: TURTLE_COLORS.sensor,
    codeName: 'getY',
    codeNameZh: '获取Y',
    argType: 'none',
    handler: (world) => world.getY(),
  },
  {
    id: 'getAngle',
    label: '获取角度',
    labelEn: 'Get Angle',
    icon: '🧭',
    color: TURTLE_COLORS.sensor,
    codeName: 'getAngle',
    codeNameZh: '获取角度',
    argType: 'none',
    handler: (world) => world.getAngle(),
  },
];

// ============ Helper Functions ============

/** Get all commands as a map by ID */
export function getCommandMap(): Map<string, CommandDefinition> {
  return new Map(TURTLE_COMMANDS.map((cmd) => [cmd.id, cmd]));
}

/** Get all conditions as a map by ID */
export function getConditionMap(): Map<string, ConditionDefinition> {
  return new Map(TURTLE_CONDITIONS.map((cond) => [cond.id, cond]));
}
