# Shenbi Documentation

> "Write code like drawing, watch it come alive!" - 用代码画画，看它活起来！

Shenbi (神笔, "Magic Brush") is a children's programming education platform inspired by the Chinese folk tale of Ma Liang's magic paintbrush.

## Documentation Index

### User Guides

| Document | Description |
|----------|-------------|
| [Core Features](./features.md) | User stories and how-to guides for all features |

### Architecture & Design

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System overview, tech stack, and code organization |
| [Mini Python Language](./language.md) | Custom programming language for children (中英文双语) |
| [Game Architecture](./game.md) | How to create new game types (World + VM + Canvas) |

### Development Guides

| Document | Description |
|----------|-------------|
| [Internationalization](./i18n.md) | Adding translations (English & Chinese) |
| [Backend API](./backend.md) | FastAPI server setup and endpoints |
| [Stripe Integration](./stripe.md) | Payment processing for Premium subscriptions |

### Business

| Document | Description |
|----------|-------------|
| [Pricing Strategy](./business/pricing.md) | B2C, B2B SaaS, and school partnership pricing |
| [Singapore Market](./business/singapore.md) | Singapore education market entry guide |
| [China Market](./business/china.md) | China operations and compliance guide |

---

## Quick Start

### Frontend Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Backend Development

```bash
cd shenbid

# Create virtual environment
uv sync

# Run server
uv run uvicorn app.main:app --reload --port 8000
```

---

## Project Structure

```
shenbi/
├── src/                    # Frontend source
│   ├── lang/               # Mini Python compiler & VM
│   ├── game/               # Game engines (maze, turtle, tower-defense)
│   ├── components/         # React components
│   ├── pages/              # Route pages
│   ├── contexts/           # Global state (Auth, Settings)
│   ├── i18n/               # Internationalization
│   └── storage/            # Data persistence
├── public/
│   └── levels/             # Level definitions (JSON)
├── shenbid/                # Backend API (FastAPI)
│   ├── app/
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API endpoints
│   │   └── schemas/        # Pydantic schemas
│   └── tests/
└── docs/                   # This documentation
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | React Context + Custom hooks |
| Backend | FastAPI + PostgreSQL + SQLAlchemy |
| Payments | Stripe |
| Language | Custom Mini Python interpreter |

---

## Current Features

### Game Types

| Game | Description | Commands |
|------|-------------|----------|
| **Maze** | Grid navigation, collect stars | `forward()`, `left()`, `right()` |
| **Turtle** | Logo-style drawing | `forward(n)`, `backward(n)`, `left(n)`, `right(n)` |
| **Tower Defense** | Strategy puzzles | `placeUnit()`, `upgrade()` |

### Language Features

- Sequential execution
- Repeat loops (`重复 N 次:` / `repeat N times:`)
- While loops (`当 条件 时:` / `while condition:`)
- Conditionals (`如果/否则` / `if/else`)
- Variables and operators
- Custom functions
- Bilingual keywords (Chinese & English)

### Platform Features

- Block-based visual editor
- Text code editor
- Adventure mode with progression
- Classroom mode for teachers
- Battle mode for multiplayer
- Progress tracking
- Achievement badges
- Premium subscriptions

---

*Last Updated: December 2024*
