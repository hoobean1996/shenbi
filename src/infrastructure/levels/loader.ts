import { LevelDefinition, EntityPlacement, BlockCategory } from '../../core/engine';
import {
  CompactLevelData,
  LevelSymbols,
  DEFAULT_MAZE_SYMBOLS,
  AdventureComplexity,
  GameType,
} from './types';
import type { Language } from '../i18n';
import {
  adventureApi,
  ApiAdventureResponse,
  ApiLevelResponse,
  StdlibFunction,
} from '../services/api';
import { warn } from '../logging';

/**
 * Parsed Adventure with full level definitions
 */
export interface ParsedAdventure {
  id: string;
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
  apiLevel: ApiLevelResponse,
  language?: Language
): LevelDefinition {
  // Use Chinese translations if available and language is zh
  const name = language === 'zh' && apiLevel.name_zh ? apiLevel.name_zh : apiLevel.name;
  const description =
    language === 'zh' && apiLevel.description_zh ? apiLevel.description_zh : apiLevel.description;
  const teachingGoal =
    language === 'zh' && apiLevel.teaching_goal_zh
      ? apiLevel.teaching_goal_zh
      : apiLevel.teaching_goal;
  const hints = language === 'zh' && apiLevel.hints_zh ? apiLevel.hints_zh : apiLevel.hints;

  // Parse grid if present
  const grid = apiLevel.grid;
  let width = 0;
  let height = 0;
  let entities: EntityPlacement[] = [];

  if (grid && grid.length > 0) {
    height = grid.length;
    width = Math.max(...grid.map((row) => row.length));

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
    name,
    description: description || undefined,
    width,
    height,
    grid: grid || undefined,
    entities,
    availableCommands: apiLevel.available_commands || undefined,
    availableSensors: apiLevel.available_sensors || undefined,
    availableBlocks: apiLevel.available_blocks as BlockCategory[] | undefined,
    teachingGoal: teachingGoal || undefined,
    hints: hints || undefined,
    gameType: apiLevel.game_type as GameType,
    expectedCode: apiLevel.expected_code || undefined,
    winCondition: apiLevel.win_condition || undefined,
    failCondition: apiLevel.fail_condition || undefined,
    requiredTier: apiLevel.required_tier,
  };
}

/**
 * Convert API adventure response to ParsedAdventure
 */
export function convertApiAdventureToParsed(
  apiAdventure: ApiAdventureResponse,
  levels: LevelDefinition[],
  language?: Language
): ParsedAdventure {
  // Use Chinese translations if available and language is zh
  const name = language === 'zh' && apiAdventure.name_zh ? apiAdventure.name_zh : apiAdventure.name;
  const description =
    language === 'zh' && apiAdventure.description_zh
      ? apiAdventure.description_zh
      : apiAdventure.description;
  const longDescription =
    language === 'zh' && apiAdventure.long_description_zh
      ? apiAdventure.long_description_zh
      : apiAdventure.long_description;

  return {
    id: apiAdventure.slug,
    name,
    description: description || undefined,
    longDescription: longDescription || undefined,
    icon: apiAdventure.icon || undefined,
    themeId: apiAdventure.theme_id || undefined,
    gameType: apiAdventure.game_type as GameType,
    complexity: apiAdventure.complexity as AdventureComplexity | undefined,
    tags: apiAdventure.tags || undefined,
    concepts: apiAdventure.concepts || undefined,
    ageRange: apiAdventure.age_range || undefined,
    stdlibFunctions: apiAdventure.stdlib_functions || undefined,
    levels,
    userId: apiAdventure.user_id,
  };
}

/**
 * Load all adventures from the backend API
 */
export async function loadAdventuresFromApi(language?: Language): Promise<{
  adventures: ParsedAdventure[];
}> {
  // Get list of all adventures
  const { adventures: adventureList } = await adventureApi.listAdventures();

  // Load full details and levels for each adventure
  const adventures: ParsedAdventure[] = [];

  for (const brief of adventureList) {
    // Get full adventure details and all its levels (using ID)
    const [adventure, apiLevels] = await Promise.all([
      adventureApi.getAdventure(brief.id),
      adventureApi.listLevels(brief.id),
    ]);

    // Convert API levels to LevelDefinition
    const levels = apiLevels.map((l) => convertApiLevelToDefinition(l, language));

    // Convert to ParsedAdventure
    adventures.push(convertApiAdventureToParsed(adventure, levels, language));
  }

  return { adventures };
}
