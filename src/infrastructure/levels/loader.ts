import {
  LevelDefinition,
  EntityPlacement,
  BlockCategory,
  CustomCommandDefinition,
} from '../../core/engine';
import {
  CompactLevelData,
  LevelSymbols,
  DEFAULT_MAZE_SYMBOLS,
  AdventureComplexity,
  GameType,
} from './types';
import type { Language } from '../i18n';
import { adventureApi, StdlibFunction } from '../services/api';
import type { AdventureResponse, LevelResponse } from '../services/api';
import { warn } from '../logging';

// Import local TypeScript levels
import { mazeLevels, type MazeLevelData } from '../../core/game/maze/levels';
import {
  turtleLevels,
  type TurtleLevelData,
} from '../../core/game/turtle/levels';

/**
 * Parsed Adventure with full level definitions
 */
export interface ParsedAdventure {
  id: string;
  /** Numeric ID from the API (for progress tracking) */
  numericId?: number;
  name: string;
  description?: string;
  longDescription?: string;
  icon?: string;
  themeId?: string;
  gameType?: GameType;
  complexity?: AdventureComplexity;
  tags?: string[];
  concepts?: string[];
  ageRange?: string;
  stdlibFunctions?: StdlibFunction[];
  levels: LevelDefinition[];
  userId?: number; // 0 = system/official, >0 = teacher-created
}

/**
 * Parse a compact level definition into the engine's LevelDefinition format
 * Supports both grid-based (maze) and non-grid (music, etc.) levels
 * Used for parsing custom teacher-created levels
 */
export function parseLevel(
  data: CompactLevelData,
  defaultSymbols: LevelSymbols = DEFAULT_MAZE_SYMBOLS
): LevelDefinition {
  const grid = data.grid;

  // For non-grid games (music, etc.), create a minimal level definition
  if (!grid || grid.length === 0) {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      width: 0,
      height: 0,
      entities: [],
      availableCommands: data.availableCommands,
      availableSensors: data.availableSensors,
      availableBlocks: data.availableBlocks as BlockCategory[] | undefined,
      teachingGoal: data.teachingGoal,
      hints: data.hints,
      expectedCode: data.expectedCode,
      gameType: data.gameType,
      winCondition: data.winCondition,
      failCondition: data.failCondition,
    };
  }

  // Grid-based parsing for maze games
  const symbols = { ...defaultSymbols, ...data.symbols };
  const height = grid.length;
  const width = Math.max(...grid.map((row) => row.length));

  const entities: EntityPlacement[] = [];

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const char = row[x];

      // Skip empty cells
      if (char === ' ' || char === '.') {
        continue;
      }

      const symbolDef = symbols[char];
      if (!symbolDef) {
        warn(`Unknown symbol in level`, { levelId: data.id, char, x, y }, 'LevelLoader');
        continue;
      }

      entities.push({
        type: symbolDef.type,
        position: { x, y },
        state: symbolDef.state,
      });
    }
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    width,
    height,
    grid, // Preserve original grid for new MazeWorld architecture
    entities,
    availableCommands: data.availableCommands,
    availableSensors: data.availableSensors,
    availableBlocks: data.availableBlocks as BlockCategory[] | undefined,
    teachingGoal: data.teachingGoal,
    hints: data.hints,
    winCondition: data.winCondition,
    failCondition: data.failCondition,
  };
}

// ============================================
// API-based Loading Functions
// ============================================

/**
 * Convert API level response to LevelDefinition
 */
export function convertApiLevelToDefinition(
  apiLevel: LevelResponse,
  _language?: Language
): LevelDefinition {
  // SDK types don't have Chinese translations
  const name = apiLevel.name;
  const description = apiLevel.description;
  const teachingGoal = apiLevel.teaching_goal;
  const hints = apiLevel.hints as string[] | null;

  // Parse grid if present
  const grid = apiLevel.grid as string[] | null;
  let width = 0;
  let height = 0;
  let entities: EntityPlacement[] = [];

  if (grid && grid.length > 0) {
    height = grid.length;
    width = Math.max(...grid.map((row: string) => row.length));

    // Parse entities from grid
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        if (char === ' ' || char === '.') continue;

        const symbolDef = DEFAULT_MAZE_SYMBOLS[char];
        if (symbolDef) {
          entities.push({
            type: symbolDef.type,
            position: { x, y },
            state: symbolDef.state,
          });
        }
      }
    }
  }

  return {
    id: apiLevel.slug,
    numericId: apiLevel.id,
    adventureNumericId: apiLevel.adventure_id,
    name,
    description: description || undefined,
    width,
    height,
    grid: grid || undefined,
    entities,
    availableCommands: apiLevel.available_commands as unknown as string[] | undefined,
    availableSensors: apiLevel.available_sensors as unknown as string[] | undefined,
    availableBlocks: apiLevel.available_blocks as unknown as BlockCategory[] | undefined,
    teachingGoal: teachingGoal || undefined,
    hints: hints || undefined,
    gameType: apiLevel.game_type as GameType,
    expectedCode: apiLevel.expected_code || undefined,
    // win_condition/fail_condition should be strings - don't double-stringify
    winCondition:
      typeof apiLevel.win_condition === 'string'
        ? apiLevel.win_condition
        : apiLevel.win_condition
          ? JSON.stringify(apiLevel.win_condition)
          : undefined,
    failCondition:
      typeof apiLevel.fail_condition === 'string'
        ? apiLevel.fail_condition
        : apiLevel.fail_condition
          ? JSON.stringify(apiLevel.fail_condition)
          : undefined,
    requiredTier: apiLevel.required_tier,
    // Custom commands from API (if any)
    customCommands: (apiLevel as unknown as { custom_commands?: CustomCommandDefinition[] })
      .custom_commands,
  };
}

/**
 * Convert API adventure response to ParsedAdventure
 */
export function convertApiAdventureToParsed(
  apiAdventure: AdventureResponse,
  levels: LevelDefinition[],
  _language?: Language
): ParsedAdventure {
  // SDK types don't have Chinese translations
  const name = apiAdventure.name;
  const description = apiAdventure.description;

  return {
    id: apiAdventure.slug,
    numericId: apiAdventure.id,
    name,
    description: description || undefined,
    longDescription: undefined, // SDK doesn't have long_description
    icon: apiAdventure.icon || undefined,
    themeId: undefined, // SDK doesn't have theme_id
    gameType: apiAdventure.game_type as GameType,
    complexity: apiAdventure.complexity as unknown as AdventureComplexity | undefined,
    tags: apiAdventure.tags as unknown as string[] | undefined,
    concepts: apiAdventure.concepts as unknown as string[] | undefined,
    ageRange: apiAdventure.age_range || undefined,
    stdlibFunctions: apiAdventure.stdlib_functions as unknown as StdlibFunction[] | undefined,
    levels,
    userId: apiAdventure.app_id, // Use app_id as userId
  };
}

/**
 * Load all adventures from the backend API
 * @deprecated Use loadLocalAdventures instead - all levels are now in local TypeScript files
 */
export async function loadAdventuresFromApi(language?: Language): Promise<{
  adventures: ParsedAdventure[];
}> {
  // Get list of all adventures
  const adventureList = await adventureApi.list();

  // Load full details and levels for each adventure
  const adventures: ParsedAdventure[] = [];

  for (const brief of adventureList) {
    // Get full adventure details and all its levels (using ID)
    const [adventure, apiLevels] = await Promise.all([
      adventureApi.get(brief.id),
      adventureApi.listLevels(brief.id),
    ]);

    // Convert API levels to LevelDefinition
    const levels = apiLevels.map((l) => convertApiLevelToDefinition(l, language));

    // Convert to ParsedAdventure
    adventures.push(convertApiAdventureToParsed(adventure, levels, language));
  }

  return { adventures };
}

// ============================================
// Local TypeScript Level Loading
// ============================================

/**
 * Convert local MazeLevelData to LevelDefinition
 */
function convertMazeLevelToDefinition(
  level: MazeLevelData,
  index: number,
  adventureNumericId: number
): LevelDefinition {
  const grid = level.grid;
  const height = grid.length;
  const width = Math.max(...grid.map((row) => row.length));

  const entities: EntityPlacement[] = [];

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      if (char === ' ' || char === '.') continue;

      const symbolDef = DEFAULT_MAZE_SYMBOLS[char];
      if (symbolDef) {
        entities.push({
          type: symbolDef.type,
          position: { x, y },
          state: symbolDef.state,
        });
      }
    }
  }

  return {
    id: level.id,
    numericId: index + 1,
    adventureNumericId,
    name: level.name,
    description: level.description,
    width,
    height,
    grid,
    entities,
    availableCommands: level.availableCommands,
    availableSensors: level.availableSensors,
    availableBlocks: level.availableBlocks as BlockCategory[],
    teachingGoal: level.teachingGoal,
    hints: level.hints,
    gameType: 'maze',
    winCondition: level.winCondition,
    failCondition: level.failCondition,
    requiredTier: level.requiredTier,
    customCommands: level.customCommands,
  };
}

/**
 * Convert local TurtleLevelData to LevelDefinition
 */
function convertTurtleLevelToDefinition(
  level: TurtleLevelData,
  index: number,
  adventureNumericId: number
): LevelDefinition {
  return {
    id: level.id,
    numericId: index + 1,
    adventureNumericId,
    name: level.name,
    description: level.description,
    width: 400,
    height: 400,
    grid: [],
    entities: [],
    availableCommands: level.availableCommands,
    availableSensors: level.availableSensors,
    availableBlocks: level.availableBlocks as BlockCategory[],
    teachingGoal: level.teachingGoal,
    hints: level.hints,
    gameType: 'turtle',
    winCondition: level.winCondition,
    failCondition: level.failCondition,
    requiredTier: level.requiredTier,
  };
}

// Stable numeric IDs for local adventures (used for progress tracking)
const MAZE_ADVENTURE_ID = 1;
const TURTLE_ADVENTURE_ID = 2;

/**
 * Load all adventures from local TypeScript level files
 * This is the primary way to load levels - no API needed
 */
export function loadLocalAdventures(): { adventures: ParsedAdventure[] } {
  // Create maze adventure from local levels
  const mazeAdventure: ParsedAdventure = {
    id: 'robot-maze',
    numericId: MAZE_ADVENTURE_ID,
    name: 'Robot Maze Adventure',
    description: 'Help the robot navigate through mazes!',
    icon: '🤖',
    gameType: 'maze',
    complexity: 'beginner',
    levels: mazeLevels.map((level, index) =>
      convertMazeLevelToDefinition(level, index, MAZE_ADVENTURE_ID)
    ),
  };

  // Create turtle adventure from local levels
  const turtleAdventure: ParsedAdventure = {
    id: 'turtle-graphics',
    numericId: TURTLE_ADVENTURE_ID,
    name: 'Turtle Graphics Adventure',
    description: 'Learn to draw amazing patterns with the turtle!',
    icon: '🐢',
    gameType: 'turtle',
    complexity: 'beginner',
    levels: turtleLevels.map((level, index) =>
      convertTurtleLevelToDefinition(level, index, TURTLE_ADVENTURE_ID)
    ),
  };

  return {
    adventures: [mazeAdventure, turtleAdventure],
  };
}
