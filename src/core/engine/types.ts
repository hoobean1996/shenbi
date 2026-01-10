// ============================================
// Core Types for Grid World Engine
// ============================================

// Position in the grid world
export interface Position {
  x: number; // column index, 0-based, increases to the right
  y: number; // row index, 0-based, increases downward
}

// Four cardinal directions
export type Direction = 'up' | 'down' | 'left' | 'right';

// ============================================
// Entity System (used by battle mode)
// ============================================

export interface Component {
  type: string;
  config?: Record<string, unknown>;
}

export interface Entity {
  id: string;
  type: string;
  position: Position;
  components: Component[];
  state: Record<string, unknown>;
}

// ============================================
// Level Definition
// ============================================

export interface EntityPlacement {
  type: string;
  position: Position;
  state?: Record<string, unknown>;
}

// Block types for visual programming
export type BlockCategory =
  | 'command'
  | 'repeat'
  | 'while'
  | 'if'
  | 'ifelse'
  | 'for'
  | 'setVariable'
  | 'print'
  | 'functionDef'
  | 'functionCall';

export interface LevelDefinition {
  id: string;
  name: string;
  description?: string;
  width?: number;
  height?: number;
  entities?: EntityPlacement[];
  // Alternative grid format (string array) - used by maze levels
  grid?: string[];
  initialState?: Record<string, unknown>;
  availableCommands?: string[];
  availableSensors?: string[];
  availableBlocks?: BlockCategory[];
  teachingGoal?: string;
  hints?: string[];
  // Music/creative game specific fields
  gameType?: 'maze' | 'music' | 'turtle' | 'hanzi';
  expectedCode?: string;
  // Win/fail conditions (MiniPython expressions)
  winCondition?: string;
  failCondition?: string;
  // Access control
  requiredTier?: string; // "free" or "premium"
}
