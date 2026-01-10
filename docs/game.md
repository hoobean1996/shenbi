# Game Architecture Guide

How to create new game types following Shenbi's **World + VM + Canvas** architecture pattern.

---

## Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    World    │────│     VM      │────│   Canvas    │
│ (Data Model)│    │(Code Runner)│    │ (Renderer)  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       │   onChange()     │   step/run()     │
       └──────────────────┴──────────────────┘
```

| Component | Responsibility | Dependencies |
|-----------|----------------|--------------|
| **World** | Pure state management | None (pure TypeScript) |
| **VM** | Code execution bridge | World + lang/vm |
| **Canvas** | Visual rendering | World + React |

---

## Existing Game Types

| Game | World | VM | Canvas | Description |
|------|-------|----|----|-------------|
| **Maze** | `MazeWorld` | `MazeVM` | `MazeCanvas` | Grid navigation |
| **Turtle** | `TurtleWorld` | `TurtleVM` | `TurtleCanvas` | Logo-style drawing |
| **Tower Defense** | `TowerDefenseWorld` | `TowerDefenseVM` | `TowerDefenseCanvas` | Strategy puzzles |

---

## Step-by-Step: Creating a New Game

### File Structure

```
src/game/mygame/
├── MyGameWorld.ts      # State & logic
├── MyGameVM.ts         # VM bindings
├── MyGameCanvas.tsx    # React renderer
├── bindings.ts         # Command definitions
└── index.ts            # Exports
```

---

### Step 1: Define Bindings

Define the commands and sensors your game provides.

```typescript
// src/game/mygame/bindings.ts

import { GameCommand, GameSensor } from '../types';

export const MYGAME_COMMANDS: GameCommand[] = [
  {
    id: 'doAction',
    nameEn: 'doAction',
    nameZh: '做动作',
    aliasesZh: ['执行'],
    description: 'Performs the main action',
  },
  // ... more commands
];

export const MYGAME_SENSORS: GameSensor[] = [
  {
    id: 'checkState',
    nameEn: 'checkState',
    nameZh: '检查状态',
    description: 'Returns true if state condition is met',
  },
  // ... more sensors
];
```

---

### Step 2: Create the World

The World is a pure TypeScript class that manages game state.

```typescript
// src/game/mygame/MyGameWorld.ts

export interface MyGameState {
  score: number;
  position: { x: number; y: number };
  isComplete: boolean;
}

export class MyGameWorld {
  private state: MyGameState;
  private initialState: MyGameState | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.getDefaultState();
  }

  private getDefaultState(): MyGameState {
    return { score: 0, position: { x: 0, y: 0 }, isComplete: false };
  }

  // ============ Level Loading ============

  loadLevel(levelData: any): void {
    this.state = {
      ...this.getDefaultState(),
      // Parse levelData...
    };
    this.initialState = { ...this.state };
    this.notifyListeners();
  }

  reset(): void {
    if (this.initialState) {
      this.state = { ...this.initialState };
      this.notifyListeners();
    }
  }

  // ============ Commands ============

  doAction(): boolean {
    this.state.score += 10;
    this.notifyListeners();
    return true;
  }

  // ============ Sensors ============

  checkState(): boolean {
    return this.state.score > 50;
  }

  // ============ State Access ============

  getState(): MyGameState {
    return { ...this.state };
  }

  // ============ Events ============

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
```

**Key Points:**
- No React imports - pure TypeScript
- Immutable state access via `{ ...this.state }`
- `onChange()` pattern for subscriptions
- `reset()` restores initial level state

---

### Step 3: Create the VM

The VM bridges Mini Python execution to World commands.

```typescript
// src/game/mygame/MyGameVM.ts

import { VM, VMState, VMStepResult, CommandHandler } from '../../lang/vm';
import { CompiledProgram, Value } from '../../lang/ir';
import { MyGameWorld } from './MyGameWorld';

export interface MyGameVMConfig {
  world: MyGameWorld;
  onPrint?: (message: string) => void;
}

export class MyGameVM {
  private vm: VM;
  private world: MyGameWorld;
  private onPrint?: (message: string) => void;

  constructor(config: MyGameVMConfig) {
    this.vm = new VM();
    this.world = config.world;
    this.onPrint = config.onPrint;
    this.registerBindings();
  }

  private registerBindings(): void {
    // Register commands (both English and Chinese)
    this.vm.registerCommand('doAction', () => this.world.doAction());
    this.vm.registerCommand('做动作', () => this.world.doAction());

    // Register sensors
    this.vm.registerSensor('checkState', () => this.world.checkState());
    this.vm.registerSensor('检查状态', () => this.world.checkState());

    // Standard print command
    const printHandler: CommandHandler = (args: Value[]) => {
      const message = args.map(a => String(a)).join(' ');
      this.onPrint?.(message);
    };
    this.vm.registerCommand('print', printHandler);
    this.vm.registerCommand('打印', printHandler);
  }

  // ============ VM Delegation ============

  load(program: CompiledProgram): void { this.vm.load(program); }
  reset(): void { this.vm.reset(); }
  step(): VMStepResult { return this.vm.step(); }
  run(): VMStepResult { return this.vm.run(); }
  runAll(): VMStepResult[] { return this.vm.runAll(); }
  pause(): void { this.vm.pause(); }
  resume(): void { this.vm.resume(); }
  getState(): VMState { return this.vm.getState(); }
  getCurrentLine(): number | null { return this.vm.getCurrentLine(); }
  getVariables(): Record<string, Value> { return this.vm.getVariables(); }
}
```

**Key Points:**
- Register both English and Chinese names
- Delegate all VM methods to inner VM
- Handle `onPrint` callback for debugging

---

### Step 4: Create the Canvas

The Canvas is a React component that renders the World state.

```typescript
// src/game/mygame/MyGameCanvas.tsx

import { useEffect, useState } from 'react';
import { MyGameWorld } from './MyGameWorld';

interface MyGameCanvasProps {
  world: MyGameWorld;
  className?: string;
}

export function MyGameCanvas({ world, className = '' }: MyGameCanvasProps) {
  const [, forceUpdate] = useState({});

  // Subscribe to world changes
  useEffect(() => {
    const unsubscribe = world.onChange(() => {
      forceUpdate({}); // Trigger re-render
    });
    return unsubscribe;
  }, [world]);

  // Get current state for rendering
  const state = world.getState();

  return (
    <div className={`relative bg-white rounded-lg p-4 ${className}`}>
      <div>Score: {state.score}</div>
      <div>Position: ({state.position.x}, {state.position.y})</div>
      {state.isComplete && <div className="text-green-500">Complete!</div>}
    </div>
  );
}
```

**Key Points:**
- Subscribe on mount with `useEffect`
- Force update pattern for state changes
- Cleanup with returned unsubscribe function

---

### Step 5: Export Module

```typescript
// src/game/mygame/index.ts

export { MyGameWorld } from './MyGameWorld';
export type { MyGameState } from './MyGameWorld';
export { MyGameVM } from './MyGameVM';
export type { MyGameVMConfig } from './MyGameVM';
export { MyGameCanvas } from './MyGameCanvas';
export { MYGAME_COMMANDS, MYGAME_SENSORS } from './bindings';
```

Update the main game exports:

```typescript
// src/game/index.ts

export * from './maze';
export * from './turtle';
export * from './tower-defense';
export * from './mygame';  // Add this
```

---

### Step 6: Add GameType

```typescript
// src/levels/types.ts

export type GameType = 'maze' | 'turtle' | 'tower-defense' | 'mygame';
```

---

### Step 7: Update CodeRunner

Add support in `src/components/CodeRunner.tsx`:

```typescript
import { MyGameWorld, MyGameVM } from '../game/mygame';

interface CodeRunnerProps {
  // ... existing props
  myGameWorld?: MyGameWorld;
}

// In the useEffect for VM creation:
if (gameType === 'mygame' && myGameWorld) {
  vmRef.current = new MyGameVM({ world: myGameWorld });
}
```

---

### Step 8: Create Levels

Add level files in `public/levels/mygame-adventure/`:

```json
// level-01.json
{
  "id": "mygame-01",
  "name": "First Level",
  "description": "Learn the basics",
  "gameType": "mygame",
  "availableCommands": ["doAction"],
  "availableSensors": ["checkState"],
  "availableBlocks": ["command", "repeat"],
  "winCondition": "score >= 50",
  "hints": ["Use doAction to increase score"],
  "expectedCode": "重复 5 次:\n    doAction()"
}
```

---

## Best Practices

1. **Keep World pure** - No React, no async, no side effects
2. **Use onChange pattern** - Let Canvas react to state changes
3. **Support both languages** - Always register Chinese and English names
4. **Reset properly** - Restore initial state on code re-run
5. **Immutable access** - Return copies from getters
6. **Type everything** - Full TypeScript types for safety

---

## Checklist for New Games

- [ ] Create `XxxWorld.ts` with state, commands, sensors, onChange
- [ ] Create `XxxVM.ts` with command/sensor bindings
- [ ] Create `XxxCanvas.tsx` with rendering logic
- [ ] Create `bindings.ts` with command definitions
- [ ] Create `index.ts` exports
- [ ] Update `src/game/index.ts` with exports
- [ ] Add game type to `src/levels/types.ts`
- [ ] Add support in `CodeRunner.tsx`
- [ ] Create adventure component if needed
- [ ] Create level files in `public/levels/`
- [ ] Add translations for commands/sensors in `i18n/translations.ts`
- [ ] Update BlockEditor types if new block types needed

---

*See also: [Architecture](./architecture.md) | [Language Design](./language.md)*
