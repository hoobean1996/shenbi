/**
 * Migration script to update level availableCommands from old format to new format.
 *
 * Old format: ["move", "turn"] or ["move"]
 * New format: ["forward", "turnLeft", "turnRight"] or ["forward"]
 *
 * Usage:
 *   npx ts-node scripts/migrate-level-commands.ts
 *
 * This script updates levels in the database via the API.
 * Make sure to set the environment variables:
 *   - API_URL: The base URL of your API (e.g., https://api.gigaboo.sg)
 *   - API_KEY: Your API key
 *   - JWT_TOKEN: Your JWT token for authentication
 */

const API_URL = process.env.API_URL || 'https://api.gigaboo.sg';
const API_KEY = process.env.API_KEY || '';
const JWT_TOKEN = process.env.JWT_TOKEN || '';

interface Level {
  id: string;
  available_commands?: string[];
  availableCommands?: string[];
  [key: string]: unknown;
}

// Mapping from old command IDs to new command IDs
const COMMAND_MIGRATION: Record<string, string[]> = {
  move: ['forward'],
  turn: ['turnLeft', 'turnRight'],
};

function migrateCommands(commands: string[]): string[] {
  const newCommands: string[] = [];

  for (const cmd of commands) {
    if (COMMAND_MIGRATION[cmd]) {
      newCommands.push(...COMMAND_MIGRATION[cmd]);
    } else {
      // Keep commands that don't need migration (e.g., 'collect', 'setColor')
      newCommands.push(cmd);
    }
  }

  // Remove duplicates while preserving order
  return [...new Set(newCommands)];
}

async function fetchLevels(): Promise<Level[]> {
  const response = await fetch(`${API_URL}/api/levels`, {
    headers: {
      'X-API-Key': API_KEY,
      Authorization: `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch levels: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.levels || data;
}

async function updateLevel(levelId: string, updates: Partial<Level>): Promise<void> {
  const response = await fetch(`${API_URL}/api/levels/${levelId}`, {
    method: 'PATCH',
    headers: {
      'X-API-Key': API_KEY,
      Authorization: `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update level ${levelId}: ${response.status} ${response.statusText}`);
  }
}

async function main() {
  console.log('Fetching levels from API...');

  try {
    const levels = await fetchLevels();
    console.log(`Found ${levels.length} levels`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const level of levels) {
      const commands = level.available_commands || level.availableCommands || [];

      // Check if migration is needed
      const needsMigration = commands.some(
        (cmd: string) => cmd === 'move' || cmd === 'turn'
      );

      if (!needsMigration) {
        skippedCount++;
        continue;
      }

      const newCommands = migrateCommands(commands);

      console.log(`\nMigrating level: ${level.id}`);
      console.log(`  Old commands: ${JSON.stringify(commands)}`);
      console.log(`  New commands: ${JSON.stringify(newCommands)}`);

      // Uncomment to actually update:
      // await updateLevel(level.id, {
      //   available_commands: newCommands,
      // });

      updatedCount++;
    }

    console.log(`\n--- Migration Summary ---`);
    console.log(`Total levels: ${levels.length}`);
    console.log(`Levels to update: ${updatedCount}`);
    console.log(`Levels skipped (already migrated): ${skippedCount}`);
    console.log(`\nNote: This was a dry run. Uncomment the updateLevel() call to apply changes.`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
