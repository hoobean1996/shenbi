# Mini Python Language Design

A simplified Python subset for children's programming education.

---

## Overview

Mini Python is designed for children aged 5-12, focusing on core programming concepts with bilingual support (Chinese & English).

### Design Principles

1. **Simplicity** - Only essential concepts, no complex syntax
2. **Visual mapping** - Every construct maps to a visual block
3. **Chinese-friendly** - Full Chinese keyword support
4. **Safe execution** - Sandboxed, no dangerous operations
5. **Progressive** - Concepts unlock by level

---

## Language Levels

### Level 1: Sequential Execution

```python
# Commands run in order
前进()
前进()
左转()
前进()
```

**Concepts:** Programs execute top to bottom

**Blocks:** Command blocks (green)

---

### Level 2: Repeat Loops

```python
# Fixed count loops
重复 4 次:
    前进()
    左转()

# English equivalent
repeat 4 times:
    forward()
    left()
```

**Concepts:** Reducing repetition

**Blocks:** Loop blocks (orange)

---

### Level 3: Conditionals

```python
# If statement
如果 前方有墙():
    左转()

# If-else statement
如果 有星星():
    收集()
否则:
    前进()

# English equivalent
if frontBlocked():
    left()
else:
    forward()
```

**Concepts:** Making decisions

**Blocks:** Condition blocks (yellow)

---

### Level 4: While Loops

```python
# Conditional loop
当 没到终点() 时:
    如果 前方有墙():
        左转()
    否则:
        前进()

# English equivalent
while not atGoal():
    if frontBlocked():
        left()
    else:
        forward()
```

**Concepts:** Unknown iteration count

**Blocks:** While blocks (orange)

---

### Level 5: Variables

```python
# Assignment
星星数 = 0

# Arithmetic
星星数 = 星星数 + 1

# Comparison
如果 星星数 >= 3:
    庆祝()
```

**Concepts:** Storing and manipulating data

**Blocks:** Variable blocks (red)

---

### Level 6: Functions

```python
# Define function
定义 走两步():
    前进()
    前进()

# Call function
走两步()
左转()
走两步()

# With parameters
定义 走N步(n):
    重复 n 次:
        前进()

走N步(3)
```

**Concepts:** Code reuse and abstraction

**Blocks:** Function blocks (purple)

---

## Lexical Structure

### Keywords (Bilingual)

```typescript
KEYWORDS = {
  // Control flow
  '如果': 'IF',      'if': 'IF',
  '否则': 'ELSE',    'else': 'ELSE',
  '重复': 'REPEAT',  'repeat': 'REPEAT',
  '次': 'TIMES',     'times': 'TIMES',
  '当': 'WHILE',     'while': 'WHILE',
  '时': 'DO',

  // Functions
  '定义': 'DEF',     'def': 'DEF',
  '返回': 'RETURN',  'return': 'RETURN',

  // Booleans
  '真': 'TRUE',      'True': 'TRUE',
  '假': 'FALSE',     'False': 'FALSE',

  // Logical
  '和': 'AND',       'and': 'AND',
  '或': 'OR',        'or': 'OR',
  '不': 'NOT',       'not': 'NOT',
}
```

### Operators

```typescript
OPERATORS = {
  '+': 'PLUS',
  '-': 'MINUS',
  '*': 'MULTIPLY',
  '/': 'DIVIDE',
  '=': 'ASSIGN',
  '==': 'EQ',
  '!=': 'NEQ',
  '<': 'LT',
  '>': 'GT',
  '<=': 'LTE',
  '>=': 'GTE',
}
```

### Special Tokens

```
INDENT      # Indentation increase
DEDENT      # Indentation decrease
NEWLINE     # Line break
NUMBER      # Numeric literal
STRING      # String literal
IDENTIFIER  # Variable/function name
```

---

## Grammar (EBNF)

```ebnf
program     = statement* EOF

statement   = simple_stmt NEWLINE
            | compound_stmt

simple_stmt = assignment
            | expr_stmt
            | return_stmt

compound_stmt = if_stmt
              | repeat_stmt
              | while_stmt
              | func_def

if_stmt     = ('if' | '如果') expression ':' block
              [('else' | '否则') ':' block]

repeat_stmt = ('repeat' | '重复') expression ('times' | '次') ':' block

while_stmt  = ('while' | '当') expression [('时')] ':' block

func_def    = ('def' | '定义') IDENTIFIER '(' params? ')' ':' block

block       = NEWLINE INDENT statement+ DEDENT

expression  = or_expr
or_expr     = and_expr (('or' | '或') and_expr)*
and_expr    = not_expr (('and' | '和') not_expr)*
not_expr    = ('not' | '不') not_expr | comparison
comparison  = arith_expr (comp_op arith_expr)*
arith_expr  = term (('+' | '-') term)*
term        = factor (('*' | '/') factor)*
factor      = '-' factor | atom
atom        = NUMBER | STRING | BOOL | IDENTIFIER | func_call | '(' expression ')'
func_call   = IDENTIFIER '(' args? ')'
```

---

## AST Node Types

```typescript
type ASTNode = Program | Statement | Expression

// Statements
type Statement =
  | ExpressionStatement
  | Assignment
  | IfStatement
  | RepeatStatement
  | WhileStatement
  | FunctionDef
  | ReturnStatement

interface IfStatement {
  type: 'IfStatement'
  condition: Expression
  consequent: Statement[]
  alternate: Statement[] | null
}

interface RepeatStatement {
  type: 'RepeatStatement'
  count: Expression
  body: Statement[]
}

interface WhileStatement {
  type: 'WhileStatement'
  condition: Expression
  body: Statement[]
}

// Expressions
type Expression =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | Identifier
  | BinaryOp
  | UnaryOp
  | CallExpression

interface CallExpression {
  type: 'CallExpression'
  callee: string
  arguments: Expression[]
}
```

---

## Execution Model

### VM State

```typescript
interface VMState {
  status: 'ready' | 'running' | 'paused' | 'completed' | 'error'
  currentLine: number | null
  callStack: StackFrame[]
  globals: Map<string, Value>
  error: string | null
}

interface StackFrame {
  functionName: string | null
  locals: Map<string, Value>
  returnTo: number | null
}
```

### Step Execution

For educational purposes, the VM supports step-by-step execution:

```typescript
interface VMStepResult {
  done: boolean
  action: string | null    // 'forward', 'left', etc.
  actionArgs: any[]
  highlightLine: number | null
}

// Usage
const vm = new VM()
vm.load(program)
while (!vm.getState().done) {
  const result = vm.step()
  // Animate the action, highlight the line
}
```

---

## Game Integration

### Command Bindings

```typescript
const commandBindings = {
  // Maze commands
  '前进': (world, player) => world.forward(player),
  'forward': (world, player) => world.forward(player),
  '左转': (world, player) => world.turnLeft(player),
  'left': (world, player) => world.turnLeft(player),

  // Turtle commands
  '前进': (world, n) => world.forward(n),
  'forward': (world, n) => world.forward(n),
}
```

### Sensor Bindings

```typescript
const sensorBindings = {
  '前方有墙': (world, player) => world.frontBlocked(player),
  'frontBlocked': (world, player) => world.frontBlocked(player),
  '有星星': (world, player) => world.hasStar(player),
  'hasStar': (world, player) => world.hasStar(player),
}
```

---

## Error Handling

### Syntax Errors (Compile Time)

```typescript
interface SyntaxError {
  type: 'SyntaxError'
  message: string        // Chinese-friendly message
  line: number
  column: number
  suggestion?: string    // Fix suggestion
}

// Example
{
  type: 'SyntaxError',
  message: '缩进不正确',
  line: 3,
  column: 0,
  suggestion: '检查这一行的空格数量是否与上一行一致'
}
```

### Runtime Errors

```typescript
interface RuntimeError {
  type: 'RuntimeError'
  message: string
  line: number
  suggestion?: string
}

// Example
{
  type: 'RuntimeError',
  message: '变量 "星星数" 还没有定义',
  line: 5,
  suggestion: '在使用变量之前，需要先给它赋值，例如：星星数 = 0'
}
```

---

## Block Mapping

Each AST node corresponds to a visual block:

```typescript
interface BlockDefinition {
  type: string
  category: 'action' | 'control' | 'sensor' | 'operator' | 'variable' | 'function'
  color: string
  template: string  // e.g., "重复 {count} 次"
  inputs: InputSlot[]
  hasBody: boolean
}

// Example: Repeat block
const repeatBlock: BlockDefinition = {
  type: 'repeat',
  category: 'control',
  color: '#FF9800',
  template: '重复 {count} 次',
  inputs: [{ name: 'count', type: 'number', default: 4 }],
  hasBody: true,
}
```

---

## File Structure

```
src/lang/
├── index.ts           # Module exports
├── lexer.ts           # Tokenization
├── parser.ts          # AST generation
├── ast.ts             # AST type definitions
├── compiler.ts        # AST → IR
├── ir.ts              # IR opcodes
├── vm.ts              # Virtual machine
├── interpreter.ts     # Legacy interpreter
├── errors.ts          # Error types
└── bindings.ts        # UI command definitions
```

---

## Example Programs

### Simple Maze (Level 1-2)

```python
# Sequential
前进()
前进()
前进()

# With loop
重复 3 次:
    前进()
```

### Smart Navigation (Level 3-4)

```python
# Left-hand rule maze solver
当 不 到达终点() 时:
    如果 左边是空的():
        左转()
        前进()
    否则:
        如果 前方有墙():
            右转()
        否则:
            前进()
```

### With Functions (Level 6)

```python
定义 找路():
    如果 前方有墙():
        如果 左边是空的():
            左转()
        否则:
            右转()

定义 走一步():
    找路()
    前进()
    如果 有星星():
        收集()

当 不 到达终点() 时:
    走一步()
```

---

*See also: [Architecture](./architecture.md) | [Game Architecture](./game.md)*
