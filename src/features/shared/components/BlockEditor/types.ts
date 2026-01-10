/**
 * Block Editor Types
 *
 * Defines the structure of visual programming blocks.
 * Supports multiple game types: maze, turtle
 */

export type GameType = 'maze' | 'turtle';

export type BlockType =
  | 'command' // Actions: game-specific commands
  | 'repeat' // Repeat N times
  | 'while' // While condition
  | 'if' // If condition
  | 'ifelse' // If-else
  | 'for' // For loop: for i in range(start, end)
  | 'forEach' // For-each loop: for item in array
  | 'setVariable' // Set variable: x = expression
  | 'print' // Print: print(expression)
  | 'functionDef' // Function definition: def name():
  | 'functionCall' // Function call: name()
  | 'listAppend' // append(array, value)
  | 'listPop' // pop(array)
  | 'listInsert' // insert(array, index, value)
  | 'break' // break - exit loop
  | 'continue' // continue - next iteration
  | 'pass'; // pass - no operation

// Maze commands - unified move/turn with direction parameter
export type MazeCommandId = 'move' | 'turn';

// Turtle commands - unified move/turn with direction + optional distance/degrees
export type TurtleCommandId = 'move' | 'turn' | 'setColor';

// Union of all command IDs
export type CommandId = MazeCommandId | TurtleCommandId;

// Maze conditions
export type MazeConditionId =
  | 'frontBlocked'
  | 'frontClear'
  | 'leftClear'
  | 'rightClear'
  | 'hasStar'
  | 'atGoal'
  | 'notAtGoal';

// Turtle conditions (none - turtle always draws)
export type TurtleConditionId = never;

// Union of all condition IDs
export type ConditionId = MazeConditionId | TurtleConditionId;

// Operator types for expressions
export type MathOperator = '+' | '-' | '*' | '/';
export type ComparisonOperator = '==' | '!=' | '<' | '>' | '<=' | '>=';
export type LogicalOperator = 'and' | 'or';

// Object property definition
export interface ObjectProperty {
  key: string;
  value: BlockExpression;
}

// Expression types for block values
export type BlockExpression =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'variable'; name: string }
  | {
      type: 'binary';
      operator: MathOperator | ComparisonOperator | LogicalOperator;
      left: BlockExpression;
      right: BlockExpression;
    }
  | { type: 'sensor'; sensor: ConditionId }
  | {
      type: 'comparison';
      operator: ComparisonOperator;
      left: BlockExpression;
      right: BlockExpression;
    }
  | { type: 'array'; elements: BlockExpression[] }
  | { type: 'arrayAccess'; array: BlockExpression; index: BlockExpression }
  | { type: 'arrayLength'; array: BlockExpression }
  | { type: 'random' } // random() - returns 0-1
  | { type: 'randint'; min: BlockExpression; max: BlockExpression } // randint(min, max)
  | { type: 'object'; properties: ObjectProperty[] } // {key: value, ...}
  | { type: 'objectAccess'; object: BlockExpression; key: BlockExpression }; // obj["key"] or obj[key]

export interface Block {
  id: string;
  type: BlockType;
  // For command blocks
  command?: CommandId;
  // For command blocks with parameters (turtle: forward(3), turnRight(90), setColor("red"))
  commandArg?: BlockExpression;
  // For command blocks with two parameters (e.g., moveTo(x, y))
  commandArg2?: BlockExpression;
  // For repeat blocks
  repeatCount?: number;
  // For conditional blocks (sensor-based)
  condition?: ConditionId;
  // For conditional blocks (expression-based comparison)
  conditionExpr?: BlockExpression;
  // Nested blocks (for repeat, while, if, ifelse, for, functionDef)
  children?: Block[];
  // For ifelse - the else branch
  elseChildren?: Block[];
  // For setVariable and for blocks - variable name
  variableName?: string;
  // For setVariable and print blocks - the value/expression
  expression?: BlockExpression;
  // For for blocks - range start and end
  rangeStart?: BlockExpression;
  rangeEnd?: BlockExpression;
  // For functionDef and functionCall blocks
  functionName?: string;
  // For functionDef blocks - parameter names
  functionParams?: string[];
  // For functionCall blocks - argument expressions
  functionArgs?: BlockExpression[];
  // For list operations (append, pop, insert)
  listArray?: BlockExpression; // The array to operate on
  listValue?: BlockExpression; // Value to append/insert
  listIndex?: BlockExpression; // Index for insert
  // For forEach blocks - the iterable expression
  iterable?: BlockExpression;
}

// Argument type for command blocks
export type ArgType = 'none' | 'number' | 'string' | 'xy';

// Block definitions for the palette
export interface BlockDefinition {
  type: BlockType;
  command?: CommandId;
  label: string;
  labelEn: string;
  color: string;
  icon?: string;
  argType?: ArgType; // Type of argument for command blocks
  defaultArg?: BlockExpression; // Default argument value
  defaultArg2?: BlockExpression; // Second default argument (for xy type)
}

// ============ COLOR PALETTE ============
// Limited palette for clean, readable UI (4 categories)
export const BLOCK_COLORS = {
  action: '#3B82F6', // Blue - commands/actions
  control: '#8B5CF6', // Purple - loops, conditions
  data: '#F59E0B', // Amber - variables, lists, print
  function: '#10B981', // Green - functions
} as const;

// ============ MAZE BLOCKS ============
// Single move/turn blocks with direction selector
export const MAZE_COMMAND_BLOCKS: BlockDefinition[] = [
  {
    type: 'command',
    command: 'move',
    label: '移动',
    labelEn: 'Move',
    color: BLOCK_COLORS.action,
    icon: '🚶',
    argType: 'string',
    defaultArg: { type: 'string', value: 'forward' },
  },
  {
    type: 'command',
    command: 'turn',
    label: '转向',
    labelEn: 'Turn',
    color: BLOCK_COLORS.action,
    icon: '🔄',
    argType: 'string',
    defaultArg: { type: 'string', value: 'left' },
  },
];

export const MAZE_CONDITIONS: { id: ConditionId; label: string; labelEn: string }[] = [
  { id: 'frontBlocked', label: '前方有障碍', labelEn: 'Front Blocked' },
  { id: 'frontClear', label: '前方畅通', labelEn: 'Front Clear' },
  { id: 'leftClear', label: '左边畅通', labelEn: 'Left Clear' },
  { id: 'rightClear', label: '右边畅通', labelEn: 'Right Clear' },
  { id: 'hasStar', label: '有星星', labelEn: 'Has Star' },
  { id: 'atGoal', label: '到达终点', labelEn: 'At Goal' },
  { id: 'notAtGoal', label: '未到终点', labelEn: 'Not At Goal' },
];

// ============ TURTLE BLOCKS ============
// Single move/turn blocks with direction + distance/degrees
export const TURTLE_COMMAND_BLOCKS: BlockDefinition[] = [
  {
    type: 'command',
    command: 'move',
    label: '移动',
    labelEn: 'Move',
    color: BLOCK_COLORS.action,
    icon: '🚶',
    argType: 'xy',
    defaultArg: { type: 'string', value: 'forward' },
    defaultArg2: { type: 'number', value: 1 },
  },
  {
    type: 'command',
    command: 'turn',
    label: '转向',
    labelEn: 'Turn',
    color: BLOCK_COLORS.action,
    icon: '🔄',
    argType: 'xy',
    defaultArg: { type: 'string', value: 'left' },
    defaultArg2: { type: 'number', value: 90 },
  },
  {
    type: 'command',
    command: 'setColor',
    label: '设置颜色',
    labelEn: 'Set Color',
    color: BLOCK_COLORS.action,
    icon: '🎨',
    argType: 'string',
    defaultArg: { type: 'string', value: 'red' },
  },
];

// Turtle has no conditions (always draws)
export const TURTLE_CONDITIONS: { id: ConditionId; label: string; labelEn: string }[] = [];

// ============ SHARED CONTROL BLOCKS ============
export const CONTROL_BLOCKS: BlockDefinition[] = [
  { type: 'repeat', label: '重复', labelEn: 'Repeat', color: BLOCK_COLORS.control, icon: '🔁' },
  { type: 'for', label: '循环', labelEn: 'For', color: BLOCK_COLORS.control, icon: '🔢' },
  { type: 'forEach', label: '遍历', labelEn: 'For Each', color: BLOCK_COLORS.control, icon: '🔄' },
  { type: 'while', label: '当...时', labelEn: 'While', color: BLOCK_COLORS.control, icon: '🔃' },
  { type: 'if', label: '如果', labelEn: 'If', color: BLOCK_COLORS.control, icon: '❓' },
  {
    type: 'ifelse',
    label: '如果否则',
    labelEn: 'If-Else',
    color: BLOCK_COLORS.control,
    icon: '🔀',
  },
  { type: 'break', label: '跳出', labelEn: 'Break', color: BLOCK_COLORS.control, icon: '🛑' },
  { type: 'continue', label: '继续', labelEn: 'Continue', color: BLOCK_COLORS.control, icon: '⏭️' },
  { type: 'pass', label: '跳过', labelEn: 'Pass', color: BLOCK_COLORS.control, icon: '⏸️' },
];

export const VARIABLE_BLOCKS: BlockDefinition[] = [
  {
    type: 'setVariable',
    label: '设置变量',
    labelEn: 'Set Variable',
    color: BLOCK_COLORS.data,
    icon: '📦',
  },
  { type: 'print', label: '打印', labelEn: 'Print', color: BLOCK_COLORS.data, icon: '📝' },
];

export const LIST_BLOCKS: BlockDefinition[] = [
  { type: 'listAppend', label: '添加', labelEn: 'Append', color: BLOCK_COLORS.data, icon: '➕' },
  { type: 'listPop', label: '弹出', labelEn: 'Pop', color: BLOCK_COLORS.data, icon: '➖' },
  { type: 'listInsert', label: '插入', labelEn: 'Insert', color: BLOCK_COLORS.data, icon: '📥' },
];

export const FUNCTION_BLOCKS: BlockDefinition[] = [
  {
    type: 'functionDef',
    label: '定义函数',
    labelEn: 'Define Function',
    color: BLOCK_COLORS.function,
    icon: '🔧',
  },
  {
    type: 'functionCall',
    label: '调用函数',
    labelEn: 'Call Function',
    color: BLOCK_COLORS.function,
    icon: '▶️',
  },
];

// ============ HELPER FUNCTIONS ============
export function getCommandBlocks(gameType: GameType): BlockDefinition[] {
  switch (gameType) {
    case 'maze':
      return MAZE_COMMAND_BLOCKS;
    case 'turtle':
      return TURTLE_COMMAND_BLOCKS;
  }
}

export function getConditions(
  gameType: GameType
): { id: ConditionId; label: string; labelEn: string }[] {
  switch (gameType) {
    case 'maze':
      return MAZE_CONDITIONS;
    case 'turtle':
      return TURTLE_CONDITIONS;
  }
}

// Generate unique block IDs
let blockIdCounter = 0;
export function generateBlockId(): string {
  return `block_${++blockIdCounter}`;
}

// Create a new block from definition
export function createBlock(def: BlockDefinition): Block {
  const block: Block = {
    id: generateBlockId(),
    type: def.type,
  };

  if (def.command) {
    block.command = def.command;
  }

  // Add default argument for command blocks that have parameters
  if (def.defaultArg) {
    block.commandArg = { ...def.defaultArg } as BlockExpression;
  }
  // Add second default argument for xy type
  if (def.defaultArg2) {
    block.commandArg2 = { ...def.defaultArg2 } as BlockExpression;
  }

  if (def.type === 'repeat') {
    block.repeatCount = 3;
    block.children = [];
  }

  if (def.type === 'while' || def.type === 'if') {
    block.condition = 'frontClear';
    block.children = [];
  }

  if (def.type === 'ifelse') {
    block.condition = 'frontClear';
    block.children = [];
    block.elseChildren = [];
  }

  if (def.type === 'for') {
    block.variableName = 'i';
    block.rangeStart = { type: 'number', value: 0 };
    block.rangeEnd = { type: 'number', value: 5 };
    block.children = [];
  }

  if (def.type === 'forEach') {
    block.variableName = 'item';
    block.iterable = { type: 'variable', name: 'arr' };
    block.children = [];
  }

  // break, continue, pass don't need any additional properties

  if (def.type === 'setVariable') {
    block.variableName = 'x';
    block.expression = { type: 'number', value: 0 };
  }

  if (def.type === 'print') {
    block.expression = { type: 'string', value: 'Hello' };
  }

  if (def.type === 'functionDef') {
    block.functionName = 'myFunction';
    block.functionParams = [];
    block.children = [];
  }

  if (def.type === 'functionCall') {
    block.functionName = 'myFunction';
    block.functionArgs = [];
  }

  if (def.type === 'listAppend') {
    block.listArray = { type: 'variable', name: 'arr' };
    block.listValue = { type: 'number', value: 0 };
  }

  if (def.type === 'listPop') {
    block.listArray = { type: 'variable', name: 'arr' };
  }

  if (def.type === 'listInsert') {
    block.listArray = { type: 'variable', name: 'arr' };
    block.listIndex = { type: 'number', value: 0 };
    block.listValue = { type: 'number', value: 0 };
  }

  return block;
}

// Deep clone an expression
function cloneExpression(expr: BlockExpression): BlockExpression {
  if (expr.type === 'binary') {
    return {
      type: 'binary',
      operator: expr.operator,
      left: cloneExpression(expr.left),
      right: cloneExpression(expr.right),
    };
  }
  if (expr.type === 'comparison') {
    return {
      type: 'comparison',
      operator: expr.operator,
      left: cloneExpression(expr.left),
      right: cloneExpression(expr.right),
    };
  }
  if (expr.type === 'array') {
    return {
      type: 'array',
      elements: expr.elements.map(cloneExpression),
    };
  }
  if (expr.type === 'arrayAccess') {
    return {
      type: 'arrayAccess',
      array: cloneExpression(expr.array),
      index: cloneExpression(expr.index),
    };
  }
  if (expr.type === 'arrayLength') {
    return {
      type: 'arrayLength',
      array: cloneExpression(expr.array),
    };
  }
  if (expr.type === 'randint') {
    return {
      type: 'randint',
      min: cloneExpression(expr.min),
      max: cloneExpression(expr.max),
    };
  }
  if (expr.type === 'random') {
    return { type: 'random' };
  }
  if (expr.type === 'object') {
    return {
      type: 'object',
      properties: expr.properties.map((p) => ({
        key: p.key,
        value: cloneExpression(p.value),
      })),
    };
  }
  if (expr.type === 'objectAccess') {
    return {
      type: 'objectAccess',
      object: cloneExpression(expr.object),
      key: cloneExpression(expr.key),
    };
  }
  return { ...expr } as BlockExpression;
}

// Deep clone a block (for dragging from palette)
export function cloneBlock(block: Block): Block {
  const clone: Block = {
    id: generateBlockId(),
    type: block.type,
  };

  if (block.command) clone.command = block.command;
  if (block.commandArg) clone.commandArg = cloneExpression(block.commandArg);
  if (block.commandArg2) clone.commandArg2 = cloneExpression(block.commandArg2);
  if (block.repeatCount !== undefined) clone.repeatCount = block.repeatCount;
  if (block.condition) clone.condition = block.condition;
  if (block.conditionExpr) clone.conditionExpr = cloneExpression(block.conditionExpr);
  if (block.children) clone.children = block.children.map(cloneBlock);
  if (block.elseChildren) clone.elseChildren = block.elseChildren.map(cloneBlock);
  if (block.variableName) clone.variableName = block.variableName;
  if (block.expression) clone.expression = cloneExpression(block.expression);
  if (block.rangeStart) clone.rangeStart = cloneExpression(block.rangeStart);
  if (block.rangeEnd) clone.rangeEnd = cloneExpression(block.rangeEnd);
  if (block.functionName) clone.functionName = block.functionName;
  if (block.functionParams) clone.functionParams = [...block.functionParams];
  if (block.functionArgs) clone.functionArgs = block.functionArgs.map(cloneExpression);
  if (block.listArray) clone.listArray = cloneExpression(block.listArray);
  if (block.listValue) clone.listValue = cloneExpression(block.listValue);
  if (block.listIndex) clone.listIndex = cloneExpression(block.listIndex);
  if (block.iterable) clone.iterable = cloneExpression(block.iterable);

  return clone;
}
