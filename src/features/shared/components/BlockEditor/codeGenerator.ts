/**
 * Code Generator
 *
 * Converts visual blocks to Mini Python code.
 * Supports multiple game types: maze, turtle
 */

import { Block, BlockExpression, GameType, ConditionId } from './types';

// ============ COMMAND NAME MAPS ============
// All games now use unified move/turn commands
const COMMAND_NAMES: Record<string, string> = {
  // Unified commands (all games)
  move: 'move',
  turn: 'turn',
  // Turtle-specific
  setColor: 'setColor',
};

function getCommandNames(_gameType: GameType): Record<string, string> {
  // All games share the same command names now
  return COMMAND_NAMES;
}

function getConditionCode(conditionId: ConditionId, _gameType: GameType): string {
  // Return the condition ID directly - it's the function name (e.g., 'notAtGoal', 'frontClear')
  // Don't return the label, as that's for display only (e.g., '未到终点', '前方畅通')
  return conditionId;
}

// Convert BlockExpression to code string
function expressionToCode(expr: BlockExpression, gameType: GameType): string {
  switch (expr.type) {
    case 'number':
      return String(expr.value);
    case 'string':
      return `"${expr.value}"`;
    case 'boolean':
      return expr.value ? 'True' : 'False';
    case 'variable':
      return expr.name;
    case 'binary':
      return `(${expressionToCode(expr.left, gameType)} ${expr.operator} ${expressionToCode(expr.right, gameType)})`;
    case 'comparison':
      return `(${expressionToCode(expr.left, gameType)} ${expr.operator} ${expressionToCode(expr.right, gameType)})`;
    case 'sensor':
      return `${getConditionCode(expr.sensor, gameType)}()`;
    case 'array':
      return `[${expr.elements.map((e) => expressionToCode(e, gameType)).join(', ')}]`;
    case 'arrayAccess':
      return `${expressionToCode(expr.array, gameType)}[${expressionToCode(expr.index, gameType)}]`;
    case 'arrayLength':
      return `len(${expressionToCode(expr.array, gameType)})`;
    case 'random':
      return 'random()';
    case 'randint':
      return `randint(${expressionToCode(expr.min, gameType)}, ${expressionToCode(expr.max, gameType)})`;
    case 'object': {
      const props = expr.properties
        .map((p) => `${p.key}: ${expressionToCode(p.value, gameType)}`)
        .join(', ');
      return `{${props}}`;
    }
    case 'objectAccess':
      return `${expressionToCode(expr.object, gameType)}[${expressionToCode(expr.key, gameType)}]`;
    default:
      return '0';
  }
}

// Get condition code - can be sensor or expression-based
function getBlockConditionCode(
  block: { condition?: ConditionId; conditionExpr?: BlockExpression },
  gameType: GameType
): string {
  if (block.conditionExpr) {
    return expressionToCode(block.conditionExpr, gameType);
  }
  if (block.condition) {
    return `${getConditionCode(block.condition, gameType)}()`;
  }
  // No condition available (e.g., music game)
  return 'true';
}

// Line number to block ID mapping
export type LineToBlockMap = Map<number, string>;

function generateBlockCodeWithMap(
  block: Block,
  indent: number,
  currentLine: number,
  lineMap: LineToBlockMap,
  gameType: GameType
): { code: string; nextLine: number } {
  const spaces = '    '.repeat(indent);
  const lines: string[] = [];
  let line = currentLine;
  const commandNames = getCommandNames(gameType);

  switch (block.type) {
    case 'command':
      if (block.command) {
        const name = commandNames[block.command] || block.command;
        // Include argument if present (e.g., forward(3), turnRight(90))
        // Handle xy type with two arguments (e.g., moveTo(x, y))
        let args = '';
        if (block.commandArg && block.commandArg2) {
          // Two arguments (xy type)
          args = `${expressionToCode(block.commandArg, gameType)}, ${expressionToCode(block.commandArg2, gameType)}`;
        } else if (block.commandArg) {
          // Single argument
          args = expressionToCode(block.commandArg, gameType);
        }
        lines.push(`${spaces}${name}(${args})`);
        lineMap.set(line, block.id);
        line++;
      }
      break;

    case 'repeat':
      lines.push(`${spaces}repeat ${block.repeatCount || 3} times:`);
      lineMap.set(line, block.id);
      line++;
      if (block.children && block.children.length > 0) {
        for (const child of block.children) {
          const result = generateBlockCodeWithMap(child, indent + 1, line, lineMap, gameType);
          lines.push(result.code);
          line = result.nextLine;
        }
      } else {
        lines.push(`${spaces}    # Add instructions here`);
        line++;
      }
      break;

    case 'while':
      lines.push(`${spaces}while ${getBlockConditionCode(block, gameType)}:`);
      lineMap.set(line, block.id);
      line++;
      if (block.children && block.children.length > 0) {
        for (const child of block.children) {
          const result = generateBlockCodeWithMap(child, indent + 1, line, lineMap, gameType);
          lines.push(result.code);
          line = result.nextLine;
        }
      } else {
        lines.push(`${spaces}    # Add instructions here`);
        line++;
      }
      break;

    case 'if':
      lines.push(`${spaces}if ${getBlockConditionCode(block, gameType)}:`);
      lineMap.set(line, block.id);
      line++;
      if (block.children && block.children.length > 0) {
        for (const child of block.children) {
          const result = generateBlockCodeWithMap(child, indent + 1, line, lineMap, gameType);
          lines.push(result.code);
          line = result.nextLine;
        }
      } else {
        lines.push(`${spaces}    # Add instructions here`);
        line++;
      }
      break;

    case 'ifelse':
      lines.push(`${spaces}if ${getBlockConditionCode(block, gameType)}:`);
      lineMap.set(line, block.id);
      line++;
      if (block.children && block.children.length > 0) {
        for (const child of block.children) {
          const result = generateBlockCodeWithMap(child, indent + 1, line, lineMap, gameType);
          lines.push(result.code);
          line = result.nextLine;
        }
      } else {
        lines.push(`${spaces}    # Add instructions here`);
        line++;
      }
      lines.push(`${spaces}else:`);
      lineMap.set(line, block.id); // else also maps to the ifelse block
      line++;
      if (block.elseChildren && block.elseChildren.length > 0) {
        for (const child of block.elseChildren) {
          const result = generateBlockCodeWithMap(child, indent + 1, line, lineMap, gameType);
          lines.push(result.code);
          line = result.nextLine;
        }
      } else {
        lines.push(`${spaces}    # Add instructions here`);
        line++;
      }
      break;

    case 'for':
      if (block.variableName && block.rangeStart && block.rangeEnd) {
        const start = expressionToCode(block.rangeStart, gameType);
        const end = expressionToCode(block.rangeEnd, gameType);
        lines.push(`${spaces}for ${block.variableName} in range(${start}, ${end}):`);
        lineMap.set(line, block.id);
        line++;
        if (block.children && block.children.length > 0) {
          for (const child of block.children) {
            const result = generateBlockCodeWithMap(child, indent + 1, line, lineMap, gameType);
            lines.push(result.code);
            line = result.nextLine;
          }
        } else {
          lines.push(`${spaces}    # Add instructions here`);
          line++;
        }
      }
      break;

    case 'forEach':
      if (block.variableName && block.iterable) {
        const iterable = expressionToCode(block.iterable, gameType);
        lines.push(`${spaces}for ${block.variableName} in ${iterable}:`);
        lineMap.set(line, block.id);
        line++;
        if (block.children && block.children.length > 0) {
          for (const child of block.children) {
            const result = generateBlockCodeWithMap(child, indent + 1, line, lineMap, gameType);
            lines.push(result.code);
            line = result.nextLine;
          }
        } else {
          lines.push(`${spaces}    pass`);
          line++;
        }
      }
      break;

    case 'break':
      lines.push(`${spaces}break`);
      lineMap.set(line, block.id);
      line++;
      break;

    case 'continue':
      lines.push(`${spaces}continue`);
      lineMap.set(line, block.id);
      line++;
      break;

    case 'pass':
      lines.push(`${spaces}pass`);
      lineMap.set(line, block.id);
      line++;
      break;

    case 'setVariable':
      if (block.variableName && block.expression) {
        lines.push(
          `${spaces}${block.variableName} = ${expressionToCode(block.expression, gameType)}`
        );
        lineMap.set(line, block.id);
        line++;
      }
      break;

    case 'print':
      if (block.expression) {
        lines.push(`${spaces}print(${expressionToCode(block.expression, gameType)})`);
        lineMap.set(line, block.id);
        line++;
      }
      break;

    case 'functionDef':
      if (block.functionName) {
        const params = block.functionParams?.join(', ') || '';
        lines.push(`${spaces}def ${block.functionName}(${params}):`);
        lineMap.set(line, block.id);
        line++;
        if (block.children && block.children.length > 0) {
          for (const child of block.children) {
            const result = generateBlockCodeWithMap(child, indent + 1, line, lineMap, gameType);
            lines.push(result.code);
            line = result.nextLine;
          }
        } else {
          lines.push(`${spaces}    pass`);
          line++;
        }
      }
      break;

    case 'functionCall':
      if (block.functionName) {
        const args =
          block.functionArgs?.map((arg) => expressionToCode(arg, gameType)).join(', ') || '';
        lines.push(`${spaces}${block.functionName}(${args})`);
        lineMap.set(line, block.id);
        line++;
      }
      break;

    case 'listAppend':
      if (block.listArray && block.listValue) {
        lines.push(
          `${spaces}append(${expressionToCode(block.listArray, gameType)}, ${expressionToCode(block.listValue, gameType)})`
        );
        lineMap.set(line, block.id);
        line++;
      }
      break;

    case 'listPop':
      if (block.listArray) {
        lines.push(`${spaces}pop(${expressionToCode(block.listArray, gameType)})`);
        lineMap.set(line, block.id);
        line++;
      }
      break;

    case 'listInsert':
      if (block.listArray && block.listIndex && block.listValue) {
        lines.push(
          `${spaces}insert(${expressionToCode(block.listArray, gameType)}, ${expressionToCode(block.listIndex, gameType)}, ${expressionToCode(block.listValue, gameType)})`
        );
        lineMap.set(line, block.id);
        line++;
      }
      break;
  }

  return { code: lines.join('\n'), nextLine: line };
}

export function generateCode(blocks: Block[], gameType: GameType = 'maze'): string {
  if (blocks.length === 0) {
    return '# Drag blocks here from the left';
  }

  return blocks
    .map((block) => generateBlockCodeWithMap(block, 0, 1, new Map(), gameType).code)
    .join('\n');
}

export function generateCodeWithLineMap(
  blocks: Block[],
  gameType: GameType = 'maze'
): { code: string; lineMap: LineToBlockMap } {
  if (blocks.length === 0) {
    return { code: '# Drag blocks here from the left', lineMap: new Map() };
  }

  const lineMap: LineToBlockMap = new Map();
  const codeLines: string[] = [];
  let currentLine = 1;

  for (const block of blocks) {
    const result = generateBlockCodeWithMap(block, 0, currentLine, lineMap, gameType);
    codeLines.push(result.code);
    currentLine = result.nextLine;
  }

  return { code: codeLines.join('\n'), lineMap };
}
