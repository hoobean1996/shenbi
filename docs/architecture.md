# Shenbi Architecture

> System architecture and design documentation for Shenbi, a children's programming education platform.

---

## Overview

Shenbi (神笔, "Magic Brush") is built on a layered architecture that separates concerns between the programming language, game engine, and user interface.

### Design Principles

1. **Game-first** - Learning through play, not lectures
2. **Progressive disclosure** - Concepts unlock gradually
3. **Bilingual** - Chinese and English seamlessly interchangeable
4. **Immediate feedback** - Every action shows results
5. **Failure-friendly** - Encourage experimentation
6. **Extensible** - Easy to add new games and content

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer (React)                          │
│   Pages · Components · BlockEditor · Canvas Renderers            │
├─────────────────────────────────────────────────────────────────┤
│                      Game Layer (TypeScript)                     │
│   MazeWorld · TurtleWorld · TowerDefenseWorld                   │
│   Game-specific VMs with command/sensor bindings                │
├─────────────────────────────────────────────────────────────────┤
│                   Language Layer (Mini Python)                   │
│   Lexer → Parser → Compiler → VM                                │
├─────────────────────────────────────────────────────────────────┤
│                     Storage Layer                                │
│   LocalStorage (offline) · API (cloud sync)                     │
├─────────────────────────────────────────────────────────────────┤
│                    Backend API (FastAPI)                         │
│   Auth · Progress · Adventures · Stripe                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Structure

### Directory Layout

```
src/
├── lang/               # Mini Python implementation
│   ├── lexer.ts        # Tokenization
│   ├── parser.ts       # AST generation
│   ├── compiler.ts     # AST → IR compilation
│   ├── vm.ts           # Virtual machine execution
│   └── ast.ts          # AST type definitions
│
├── game/               # Game implementations
│   ├── maze/           # Grid-based navigation
│   ├── turtle/         # Logo-style drawing
│   └── tower-defense/  # Strategy puzzles
│
├── components/         # React components
│   ├── BlockEditor/    # Visual block programming
│   ├── adventures/     # Game-specific UI
│   ├── battle/         # Multiplayer mode
│   └── classroom/      # Teacher tools
│
├── pages/              # Route pages
├── contexts/           # Global state
├── i18n/               # Translations
├── storage/            # Data persistence
└── levels/             # Level loading
```

---

## Game Engine Design

Each game follows the **World + VM + Canvas** pattern:

### World (Data Model)

Pure TypeScript class that manages game state. No React dependencies.

```typescript
export class GameWorld {
  private state: GameState;
  private listeners: Set<() => void> = new Set();

  // Commands (modify state)
  forward(): void { /* ... */ this.notifyListeners(); }

  // Sensors (query state)
  isAtGoal(): boolean { return this.state.atGoal; }

  // State access
  getState(): GameState { return { ...this.state }; }

  // Event subscription
  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
```

### VM (Code Executor)

Wraps the pure Mini Python VM and registers game-specific bindings.

```typescript
export class GameVM {
  private vm: VM;
  private world: GameWorld;

  constructor(config: { world: GameWorld }) {
    this.vm = new VM();
    this.world = config.world;

    // Register commands (English + Chinese)
    this.vm.registerCommand('forward', () => this.world.forward());
    this.vm.registerCommand('前进', () => this.world.forward());

    // Register sensors
    this.vm.registerSensor('atGoal', () => this.world.isAtGoal());
    this.vm.registerSensor('到达终点', () => this.world.isAtGoal());
  }
}
```

### Canvas (React Renderer)

Subscribes to World changes and renders the visual state.

```typescript
export function GameCanvas({ world }: { world: GameWorld }) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    return world.onChange(() => forceUpdate({}));
  }, [world]);

  const state = world.getState();
  return <div>{/* render state */}</div>;
}
```

---

## Grid World Engine

For maze-style games, the engine uses a component-based entity system.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Position** | Grid coordinates (x, y) starting from (0, 0) |
| **Direction** | Four cardinal directions: up, down, left, right |
| **Entity** | Game objects with type, position, and components |
| **Component** | Entity capabilities (Solid, Collectible, Actor) |

### Entity Components

| Component | Purpose | Example |
|-----------|---------|---------|
| `Renderable` | Has visual appearance | All visible entities |
| `Solid` | Blocks movement | Walls, obstacles |
| `Collectible` | Can be collected | Stars, keys |
| `Actor` | Can execute actions | Player, NPCs |
| `Trigger` | Activates on entry | Goal, traps |

### Event System

Events enable decoupled game logic:

```typescript
// Movement events
'move_attempt' | 'move_success' | 'move_blocked'

// Interaction events
'collect' | 'push' | 'interact' | 'trigger_enter'

// Game flow events
'level_complete' | 'level_failed'
```

---

## Level Definition

Levels are defined in JSON format in `public/levels/`:

```json
{
  "id": "maze-01",
  "name": "First Steps",
  "description": "Learn to move forward",
  "gameType": "maze",
  "width": 5,
  "height": 5,
  "entities": [
    { "type": "player", "position": { "x": 0, "y": 0 } },
    { "type": "goal", "position": { "x": 4, "y": 4 } }
  ],
  "availableCommands": ["forward", "left", "right"],
  "availableSensors": ["frontBlocked"],
  "availableBlocks": ["command", "repeat"],
  "hints": ["Move forward to start!"],
  "teachingGoal": "Sequential execution"
}
```

### Content Hierarchy

```
Level Pack → Adventures → Levels
```

- **Level Pack**: Collection of adventures (e.g., "Maze Mastery")
- **Adventure**: Themed story with 4-10 levels (e.g., "Robot H")
- **Level**: Individual puzzle with specific teaching goals

---

## Code Execution Pipeline

```
User Code (Mini Python)
        ↓
   ┌─────────┐
   │  Lexer  │  Tokenize source code
   └────┬────┘
        ↓
   ┌─────────┐
   │ Parser  │  Build Abstract Syntax Tree
   └────┬────┘
        ↓
   ┌──────────┐
   │ Compiler │  Generate IR bytecode
   └────┬─────┘
        ↓
   ┌─────────┐
   │   VM    │  Execute with step/run modes
   └────┬────┘
        ↓
   Game Commands (world.forward(), etc.)
        ↓
   World State Update
        ↓
   Canvas Re-render
```

### Execution Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Step** | Execute one instruction at a time | Learning mode |
| **Run** | Continuous execution with delays | Normal play |
| **Fast** | Instant execution, no animation | Testing |

---

## State Management

### Global Contexts

| Context | Purpose |
|---------|---------|
| `AuthContext` | User authentication, device ID |
| `SettingsContext` | Language, theme, sound |
| `AdventureContext` | Current adventure/level state |

### Storage

Two storage providers with the same interface:

```typescript
interface StorageProvider {
  getProgress(userId: string): Promise<Progress>;
  saveProgress(userId: string, progress: Progress): Promise<void>;
  // ...
}
```

- **LocalStorageProvider**: Offline, no account required
- **ApiStorageProvider**: Cloud sync with FastAPI backend

---

## Backend Architecture

### FastAPI Structure

```
shenbid/app/
├── main.py           # App entry point
├── config.py         # Environment settings
├── database.py       # PostgreSQL connection
├── deps.py           # Dependency injection
├── models/           # SQLAlchemy models
│   ├── user.py
│   ├── progress.py
│   └── achievement.py
├── routers/          # API endpoints
│   ├── auth.py
│   ├── progress.py
│   └── stripe.py
└── schemas/          # Pydantic validation
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create user from device ID |
| `/api/progress` | GET/POST | Level progress CRUD |
| `/api/achievements` | GET/POST | Badge management |
| `/api/stripe/checkout` | POST | Premium upgrade |

---

## Tech Stack Summary

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **State** | React Context, Custom Hooks |
| **DnD** | react-dnd with touch support |
| **Backend** | FastAPI, PostgreSQL, SQLAlchemy |
| **Auth** | Device-based (no passwords) |
| **Payments** | Stripe Checkout |
| **Language** | Custom Mini Python interpreter |

---

## Future Considerations

### Planned Games
- Music composition (audio synthesis)
- Hanzi writing (stroke order)

### Planned Features
- Step-back debugging
- Breakpoints
- Variable watch
- Code sharing
- Custom level creator

---

*See also: [Game Architecture](./game.md) | [Language Design](./language.md)*
