/**
 * Maze Game Commands
 *
 * Single source of truth for maze commands and conditions.
 * Used by: MazeVM (registration), BlockEditor (UI), CodeGenerator (code output)
 */

import { MazeWorld } from './MazeWorld';
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
  handler: (world: MazeWorld, args: Value[]) => Value | void;
}

export interface ConditionDefinition {
  /** Unique condition ID */
  id: string;
  /** Display label in Chinese */
  label: string;
  /** Display label in English */
  labelEn: string;
  /** Code name to emit (e.g., 'frontBlocked') */
  codeName: string;
  /** Chinese code alias */
  codeNameZh: string;
  /** Handler function - returns boolean */
  handler: (world: MazeWorld) => boolean;
}

// ============ Colors ============

export const MAZE_COLORS = {
  action: '#3B82F6', // Blue - movement commands
  sensor: '#10B981', // Green - conditions/sensors
} as const;

// ============ Commands ============

export const MAZE_COMMANDS: CommandDefinition[] = [
  {
    id: 'forward',
    label: '前进',
    labelEn: 'Forward',
    icon: '⬆️',
    color: MAZE_COLORS.action,
    codeName: 'forward',
    codeNameZh: '前进',
    argType: 'none',
    handler: (world) => world.moveForward(),
  },
  {
    id: 'backward',
    label: '后退',
    labelEn: 'Backward',
    icon: '⬇️',
    color: MAZE_COLORS.action,
    codeName: 'backward',
    codeNameZh: '后退',
    argType: 'none',
    handler: (world) => world.moveBackward(),
  },
  {
    id: 'turnLeft',
    label: '左转',
    labelEn: 'Turn Left',
    icon: '↩️',
    color: MAZE_COLORS.action,
    codeName: 'turnLeft',
    codeNameZh: '左转',
    argType: 'none',
    handler: (world) => world.turnLeft(),
  },
  {
    id: 'turnRight',
    label: '右转',
    labelEn: 'Turn Right',
    icon: '↪️',
    color: MAZE_COLORS.action,
    codeName: 'turnRight',
    codeNameZh: '右转',
    argType: 'none',
    handler: (world) => world.turnRight(),
  },
  {
    id: 'collect',
    label: '收集',
    labelEn: 'Collect',
    icon: '⭐',
    color: MAZE_COLORS.action,
    codeName: 'collect',
    codeNameZh: '收集',
    argType: 'none',
    handler: (world) => world.collect(),
  },
];

// ============ Conditions ============

export const MAZE_CONDITIONS: ConditionDefinition[] = [
  {
    id: 'frontBlocked',
    label: '前方有墙',
    labelEn: 'Front Blocked',
    codeName: 'frontBlocked',
    codeNameZh: '前方有墙',
    handler: (world) => world.isFrontBlocked(),
  },
  {
    id: 'frontClear',
    label: '前方无墙',
    labelEn: 'Front Clear',
    codeName: 'frontClear',
    codeNameZh: '前方无墙',
    handler: (world) => world.isFrontClear(),
  },
  {
    id: 'atGoal',
    label: '到达终点',
    labelEn: 'At Goal',
    codeName: 'atGoal',
    codeNameZh: '到达终点',
    handler: (world) => world.isAtGoal(),
  },
  {
    id: 'notAtGoal',
    label: '未到终点',
    labelEn: 'Not At Goal',
    codeName: 'notAtGoal',
    codeNameZh: '未到终点',
    handler: (world) => !world.isAtGoal(),
  },
  {
    id: 'hasStar',
    label: '有星星',
    labelEn: 'Has Star',
    codeName: 'hasStar',
    codeNameZh: '有星星',
    handler: (world) => world.hasStarHere(),
  },
];

// ============ Additional Sensors (not used in conditions, but available) ============

export const MAZE_SENSORS: CommandDefinition[] = [
  {
    id: 'remainingStars',
    label: '剩余星星',
    labelEn: 'Remaining Stars',
    icon: '🔢',
    color: MAZE_COLORS.sensor,
    codeName: 'remainingStars',
    codeNameZh: '剩余星星',
    argType: 'none',
    handler: (world) => world.getRemainingStars(),
  },
  {
    id: 'collectedCount',
    label: '已收集',
    labelEn: 'Collected Count',
    icon: '🔢',
    color: MAZE_COLORS.sensor,
    codeName: 'collectedCount',
    codeNameZh: '已收集',
    argType: 'none',
    handler: (world) => world.getCollectedCount(),
  },
];

// ============ Helper Functions ============

/** Get all commands as a map by ID */
export function getCommandMap(): Map<string, CommandDefinition> {
  return new Map(MAZE_COMMANDS.map((cmd) => [cmd.id, cmd]));
}

/** Get all conditions as a map by ID */
export function getConditionMap(): Map<string, ConditionDefinition> {
  return new Map(MAZE_CONDITIONS.map((cond) => [cond.id, cond]));
}
