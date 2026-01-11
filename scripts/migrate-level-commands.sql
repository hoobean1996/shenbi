-- Migration script to update level availableCommands from old format to new format
--
-- Old format: ["move", "turn"] or ["move"]
-- New format: ["forward", "turnLeft", "turnRight"] or ["forward"]
--
-- Run this against your PostgreSQL database

-- First, let's see what levels need updating (dry run)
SELECT
  id,
  name,
  available_commands
FROM levels
WHERE
  available_commands::text LIKE '%"move"%'
  OR available_commands::text LIKE '%"turn"%';

-- Update levels with ["move"] -> ["forward"]
UPDATE levels
SET available_commands =
  CASE
    WHEN available_commands = '["move"]'::jsonb
    THEN '["forward"]'::jsonb
    ELSE available_commands
  END
WHERE available_commands = '["move"]'::jsonb;

-- Update levels with ["move", "turn"] -> ["forward", "turnLeft", "turnRight"]
UPDATE levels
SET available_commands = '["forward", "turnLeft", "turnRight"]'::jsonb
WHERE available_commands = '["move", "turn"]'::jsonb;

-- Update levels with ["move", "turn", "collect"] -> ["forward", "turnLeft", "turnRight", "collect"]
UPDATE levels
SET available_commands = '["forward", "turnLeft", "turnRight", "collect"]'::jsonb
WHERE available_commands = '["move", "turn", "collect"]'::jsonb;

-- Update levels with ["move", "turn", "setColor"] -> ["forward", "turnLeft", "turnRight", "setColor"]
UPDATE levels
SET available_commands = '["forward", "turnLeft", "turnRight", "setColor"]'::jsonb
WHERE available_commands = '["move", "turn", "setColor"]'::jsonb;

-- For more complex cases, use a general replacement approach
-- This handles any combination by replacing individual commands

-- Step 1: Replace "move" with "forward" in arrays
UPDATE levels
SET available_commands = (
  SELECT jsonb_agg(
    CASE
      WHEN elem = '"move"' THEN '"forward"'
      ELSE elem
    END
  )
  FROM jsonb_array_elements_text(available_commands) AS elem
)
WHERE available_commands::text LIKE '%"move"%';

-- Step 2: Replace "turn" with "turnLeft", "turnRight"
-- This is trickier because we need to expand one item into two
-- Here's a more comprehensive approach using a CTE

WITH expanded AS (
  SELECT
    l.id,
    jsonb_agg(
      CASE
        WHEN e.value::text = '"turn"' THEN NULL  -- Mark for expansion
        ELSE e.value
      END
    ) FILTER (WHERE e.value::text != '"turn"') AS non_turn_commands,
    bool_or(e.value::text = '"turn"') AS has_turn
  FROM levels l,
       jsonb_array_elements(l.available_commands) e
  WHERE l.available_commands::text LIKE '%"turn"%'
  GROUP BY l.id
)
UPDATE levels l
SET available_commands = (
  SELECT
    CASE
      WHEN e.has_turn
      THEN (
        COALESCE(e.non_turn_commands, '[]'::jsonb) || '["turnLeft", "turnRight"]'::jsonb
      )
      ELSE l.available_commands
    END
  FROM expanded e
  WHERE e.id = l.id
)
WHERE l.id IN (SELECT id FROM expanded WHERE has_turn);

-- Verify the updates
SELECT
  id,
  name,
  available_commands
FROM levels
ORDER BY id;
