/**
 * TurtleWorld Standard Library
 *
 * MiniPython implementation of turtle graphics commands.
 * Functions are stored individually for frontend access.
 */

import { Stdlib, StdlibFunction, buildStdlibString } from '../stdlib-types';

// ============ Preamble (constants) ============

const TURTLE_PREAMBLE = `# TurtleWorld Standard Library
# Operates on shared 'world' object

# Color mappings
COLORS = {'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e', 'yellow': '#eab308', 'purple': '#a855f7', 'orange': '#f97316', 'black': '#000000', 'white': '#ffffff', '红': '#ef4444', '红色': '#ef4444', '蓝': '#3b82f6', '蓝色': '#3b82f6', '绿': '#22c55e', '绿色': '#22c55e', '黄': '#eab308', '黄色': '#eab308', '紫': '#a855f7', '紫色': '#a855f7', '橙': '#f97316', '橙色': '#f97316', '黑': '#000000', '黑色': '#000000', '白': '#ffffff', '白色': '#ffffff'}`;

// ============ Stdlib Functions ============

const TURTLE_STDLIB_FUNCTIONS: Record<string, StdlibFunction> = {
  // Movement commands
  forward: {
    name: 'forward',
    nameZh: '前进',
    description: 'Move turtle forward by distance',
    descriptionZh: '向前移动指定距离',
    params: [{ name: 'distance', nameZh: '距离', type: 'number' }],
    category: 'movement',
    code: `def forward(distance):
    radians = world.angle * 3.14159265359 / 180
    dx = _cos(radians) * distance * world.stepSize
    dy = _sin(radians) * distance * world.stepSize * -1
    oldX = world.x
    oldY = world.y
    world.x = world.x + dx
    world.y = world.y + dy
    if world.penDown:
        _drawLine(oldX, oldY, world.x, world.y, world.penColor, world.penWidth)`,
  },

  backward: {
    name: 'backward',
    nameZh: '后退',
    description: 'Move turtle backward by distance',
    descriptionZh: '向后移动指定距离',
    params: [{ name: 'distance', nameZh: '距离', type: 'number' }],
    category: 'movement',
    code: `def backward(distance):
    forward(distance * -1)`,
  },

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

  // Rotation commands
  turnLeft: {
    name: 'turnLeft',
    nameZh: '左转',
    description: 'Turn turtle left by degrees',
    descriptionZh: '向左转指定角度',
    params: [{ name: 'degrees', nameZh: '角度', type: 'number' }],
    category: 'movement',
    code: `def turnLeft(degrees):
    world.angle = (world.angle + degrees) % 360`,
  },

  turnRight: {
    name: 'turnRight',
    nameZh: '右转',
    description: 'Turn turtle right by degrees',
    descriptionZh: '向右转指定角度',
    params: [{ name: 'degrees', nameZh: '角度', type: 'number' }],
    category: 'movement',
    code: `def turnRight(degrees):
    world.angle = (world.angle - degrees + 360) % 360`,
  },

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

  left: {
    name: 'left',
    nameZh: '左转',
    description: 'Alias for turnLeft',
    descriptionZh: 'turnLeft的别名',
    params: [{ name: 'degrees', nameZh: '角度', type: 'number' }],
    category: 'movement',
    code: `def left(degrees):
    turnLeft(degrees)`,
  },

  right: {
    name: 'right',
    nameZh: '右转',
    description: 'Alias for turnRight',
    descriptionZh: 'turnRight的别名',
    params: [{ name: 'degrees', nameZh: '角度', type: 'number' }],
    category: 'movement',
    code: `def right(degrees):
    turnRight(degrees)`,
  },

  // Pen commands
  penUp: {
    name: 'penUp',
    nameZh: '抬笔',
    description: 'Lift pen (stop drawing)',
    descriptionZh: '抬起画笔（停止画线）',
    category: 'action',
    code: `def penUp():
    world.penDown = False`,
  },

  penDown: {
    name: 'penDown',
    nameZh: '落笔',
    description: 'Lower pen (start drawing)',
    descriptionZh: '落下画笔（开始画线）',
    category: 'action',
    code: `def penDown():
    world.penDown = True`,
  },

  setColor: {
    name: 'setColor',
    nameZh: '设置颜色',
    description: 'Set pen color',
    descriptionZh: '设置画笔颜色',
    params: [{ name: 'color', nameZh: '颜色', type: 'string' }],
    category: 'action',
    code: `def setColor(color):
    if color in COLORS:
        world.penColor = COLORS[color]
    else:
        world.penColor = color`,
  },

  setWidth: {
    name: 'setWidth',
    nameZh: '设置宽度',
    description: 'Set pen width',
    descriptionZh: '设置画笔宽度',
    params: [{ name: 'width', nameZh: '宽度', type: 'number' }],
    category: 'action',
    code: `def setWidth(width):
    world.penWidth = width`,
  },

  // Sensors
  getX: {
    name: 'getX',
    nameZh: '获取X',
    description: 'Get turtle X position',
    descriptionZh: '获取海龟X坐标',
    returns: 'number',
    category: 'sensor',
    code: `def getX():
    return world.x`,
  },

  getY: {
    name: 'getY',
    nameZh: '获取Y',
    description: 'Get turtle Y position',
    descriptionZh: '获取海龟Y坐标',
    returns: 'number',
    category: 'sensor',
    code: `def getY():
    return world.y`,
  },

  getAngle: {
    name: 'getAngle',
    nameZh: '获取角度',
    description: 'Get turtle angle',
    descriptionZh: '获取海龟朝向角度',
    returns: 'number',
    category: 'sensor',
    code: `def getAngle():
    return world.angle`,
  },

  isPenDown: {
    name: 'isPenDown',
    nameZh: '画笔落下',
    description: 'Check if pen is down',
    descriptionZh: '检查画笔是否落下',
    returns: 'boolean',
    category: 'sensor',
    code: `def isPenDown():
    return world.penDown`,
  },
};

// Chinese aliases
const TURTLE_CHINESE_ALIASES = `
# ============ Chinese Aliases ============

def 前进(距离):
    forward(距离)

def 后退(距离):
    backward(距离)

def 移动(方向, 距离):
    move(方向, 距离)

def 左转(角度):
    turnLeft(角度)

def 右转(角度):
    turnRight(角度)

def 转向(方向, 角度):
    turn(方向, 角度)

def 抬笔():
    penUp()

def 落笔():
    penDown()

def 设置颜色(颜色):
    setColor(颜色)

def 颜色(颜色):
    setColor(颜色)

def 设置宽度(宽度):
    setWidth(宽度)

def 获取X():
    return getX()

def 获取Y():
    return getY()

def 获取角度():
    return getAngle()`;

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
