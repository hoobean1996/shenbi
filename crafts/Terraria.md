# Mini Terraria - Game Design

A simplified 2D crafting and building game inspired by Terraria/Minecraft, designed to teach programming concepts through resource gathering, crafting, and building.

---

## Overview

**Theme:** A tiny adventurer in a 2D world who gathers resources, crafts tools, and builds structures.

**Target Age:** 6-12 years old

**Core Loop:**
1. Explore the world
2. Gather resources (chop trees, mine rocks)
3. Craft items (tools, blocks, items)
4. Build structures
5. Complete objectives

---

## Game World

### Grid Layout

```
┌─────────────────────────────────┐
│ ☁️  ☁️      ☁️      ☁️  ☁️     │  Sky
│                                 │
│ 🌳 🌳    🌳    🪨 🪨 🌳 🌳    │  Surface
│ 🟫 🟫 🟫 🟫 🟫 🟫 🟫 🟫 🟫 🟫 │  Dirt
│ 🪨 🟫 🪨 💎 🟫 🟫 🪨 🟫 💎 🟫 │  Underground
│ 🪨 🪨 🪨 🪨 🪨 🪨 🪨 🪨 🪨 🪨 │  Stone
└─────────────────────────────────┘
```

### Cell Types

| Cell | Emoji | Description | Drops |
|------|-------|-------------|-------|
| Empty | ⬜ | Air, can walk through | - |
| Dirt | 🟫 | Soft ground | Dirt x1 |
| Stone | 🪨 | Hard rock, needs pickaxe | Stone x1 |
| Tree | 🌳 | Chop for wood | Wood x3 |
| Diamond | 💎 | Rare gem | Diamond x1 |
| Water | 💧 | Can't walk, can swim | - |
| Grass | 🌿 | Decorative surface | - |

### Placeable Blocks

| Block | Emoji | Recipe |
|-------|-------|--------|
| Wood Plank | 🪵 | Crafted from wood |
| Brick | 🧱 | Crafted from stone |
| Door | 🚪 | 6 wood planks |
| Torch | 🔥 | 1 wood + 1 coal |
| Chest | 📦 | 8 wood planks |
| Ladder | 🪜 | 3 wood |

---

## Player

### Attributes

- **Position:** (x, y) on grid
- **Direction:** up, down, left, right
- **Inventory:** Dictionary of item → count
- **Equipped Tool:** None, Axe, Pickaxe, Sword

### Movement

Player can move in 4 directions:
- Can walk on empty cells
- Can climb ladders
- Falls down if no block below (gravity)
- Cannot walk through solid blocks

---

## Commands (What Player Can Do)

### Movement
| Command | Description |
|---------|-------------|
| `move(direction)` | Move up/down/left/right |
| `moveUp()` | Move up (or jump) |
| `moveDown()` | Move down |
| `moveLeft()` | Move left |
| `moveRight()` | Move right |

### Actions
| Command | Description |
|---------|-------------|
| `chop()` | Chop tree in front (needs to face tree) |
| `mine()` | Mine block in front (stone needs pickaxe) |
| `dig()` | Dig dirt below |
| `place(block)` | Place block from inventory in front |
| `craft(item)` | Craft item if have materials |
| `equip(tool)` | Equip tool from inventory |

### Building
| Command | Description |
|---------|-------------|
| `placeAbove(block)` | Place block above player |
| `placeBelow(block)` | Place block below player |
| `placeFront(block)` | Place block in facing direction |

---

## Sensors (What Player Can See)

### Position & Direction
| Sensor | Returns | Description |
|--------|---------|-------------|
| `getX()` | number | Player X position |
| `getY()` | number | Player Y position |
| `getDirection()` | string | Current facing direction |

### Inventory
| Sensor | Returns | Description |
|--------|---------|-------------|
| `hasItem(item)` | boolean | Check if have item |
| `getItemCount(item)` | number | Count of item in inventory |
| `canCraft(item)` | boolean | Check if can craft item |
| `getEquipped()` | string | Currently equipped tool |

### World Sensing
| Sensor | Returns | Description |
|--------|---------|-------------|
| `blockAt(direction)` | string | What block is in direction |
| `blockAbove()` | string | Block above player |
| `blockBelow()` | string | Block below player |
| `blockFront()` | string | Block player is facing |
| `isBlocked(direction)` | boolean | Is movement blocked |
| `canMine()` | boolean | Can mine block in front |
| `canChop()` | boolean | Is tree in front |

---

## Crafting Recipes

### Basic Materials
| Item | Recipe | Description |
|------|--------|-------------|
| Plank | 1 Wood → 4 Planks | Basic building material |
| Stick | 2 Planks → 4 Sticks | Crafting component |

### Tools
| Item | Recipe | Description |
|------|--------|-------------|
| Wooden Axe | 3 Planks + 2 Sticks | Chop trees faster |
| Wooden Pickaxe | 3 Planks + 2 Sticks | Mine stone |
| Stone Pickaxe | 3 Stone + 2 Sticks | Mine faster, get diamonds |

### Building
| Item | Recipe | Description |
|------|--------|-------------|
| Door | 6 Planks | Entrance to buildings |
| Ladder | 3 Sticks | Climb up/down |
| Torch | 1 Stick + 1 Coal | Light source |
| Chest | 8 Planks | Storage |
| Brick | 4 Stone → 4 Bricks | Strong building block |

---

## Level Progression

### Level 1: First Steps
**Goal:** Chop 1 tree
**Available Commands:** `moveRight()`, `chop()`
**Teaching:** Basic movement and action

```python
moveRight()
moveRight()
chop()
```

### Level 2: Collect Wood
**Goal:** Collect 6 wood
**Available Commands:** `move()`, `chop()`
**Teaching:** Loops

```python
for i in range(2):
    moveRight()
    chop()
```

### Level 3: Craft Planks
**Goal:** Craft 8 planks
**Available Commands:** `move()`, `chop()`, `craft()`
**Teaching:** Sequences, crafting

```python
chop()
chop()
craft("plank")
craft("plank")
```

### Level 4: Build a Wall
**Goal:** Place 4 planks in a row
**Available Commands:** All movement, `chop()`, `craft()`, `place()`
**Teaching:** Planning, building

```python
# Gather and craft
chop()
craft("plank")

# Build
moveRight()
place("plank")
moveRight()
place("plank")
# ...
```

### Level 5: Make a Pickaxe
**Goal:** Craft a wooden pickaxe
**Available Commands:** All basic commands
**Teaching:** Multi-step crafting

```python
# Get wood
chop()
chop()

# Make planks
craft("plank")

# Make sticks
craft("stick")

# Make pickaxe
craft("wooden_pickaxe")
```

### Level 6: Mining
**Goal:** Mine 5 stone
**Available Commands:** All + `mine()`, `equip()`
**Teaching:** Tool usage, conditionals

```python
equip("wooden_pickaxe")

while getItemCount("stone") < 5:
    if canMine():
        mine()
    else:
        moveRight()
```

### Level 7: Build a House
**Goal:** Build a 3x3 house with door
**Available Commands:** All
**Teaching:** Complex planning, loops for building

```python
# Gather resources
for i in range(5):
    chop()
craft("plank")
craft("door")

# Build walls
for i in range(3):
    place("plank")
    moveUp()
# ... continue building
```

### Level 8+: Advanced Challenges
- Find and mine diamonds
- Build multi-story structures
- Survive night (enemies?)
- Resource optimization challenges

---

## Win Conditions

Expressed as condition strings:

```python
# Level 1
"getItemCount('wood') >= 3"

# Level 3
"getItemCount('plank') >= 8"

# Level 5
"hasItem('wooden_pickaxe')"

# Level 7 (house built)
"structureComplete('house')"
```

---

## Visual Style

### Color Palette
- **Sky:** Light blue gradient `#87CEEB`
- **Dirt:** Brown `#8B4513`
- **Stone:** Gray `#808080`
- **Wood:** Tan `#DEB887`
- **Grass:** Green `#228B22`
- **Player:** Cute character sprite

### Emoji Rendering
Use emojis for blocks (simple mode):
```
🌳 🌳 ⬜ ⬜ 🪨
🟫 🟫 🧍 🟫 🟫
🪨 🪨 🪨 💎 🪨
```

### Sprite Rendering (Advanced)
Custom pixel art sprites for polished look.

---

## Sound Effects (Future)

| Action | Sound |
|--------|-------|
| Chop | Wood chop sound |
| Mine | Pick hitting rock |
| Craft | Crafting jingle |
| Place | Block placement thud |
| Walk | Footsteps |
| Collect | Item pickup ding |

---

## Educational Value

### Programming Concepts Taught

| Concept | How It's Taught |
|---------|-----------------|
| Sequences | Chop → Craft → Build steps |
| Loops | Gathering multiple resources |
| Conditionals | Check if can mine, has items |
| Variables | Inventory tracking |
| Functions | Craft recipes as functions |
| Planning | Multi-step building projects |
| State | Tool equipped, inventory state |

### Problem Solving Skills
- Resource management
- Spatial reasoning (building)
- Goal decomposition
- Optimization (efficient gathering)

---

## Bilingual Commands

| English | Chinese | Description |
|---------|---------|-------------|
| `move(dir)` | `移动(方向)` | Move in direction |
| `chop()` | `砍树()` | Chop tree |
| `mine()` | `挖矿()` | Mine block |
| `craft(item)` | `制作(物品)` | Craft item |
| `place(block)` | `放置(方块)` | Place block |
| `equip(tool)` | `装备(工具)` | Equip tool |
| `hasItem(item)` | `有物品(物品)` | Check inventory |
| `canCraft(item)` | `能制作(物品)` | Check craftable |

---

*Last Updated: December 2024*
