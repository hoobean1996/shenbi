# Backend API Guide

FastAPI-based REST API for Shenbi platform.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 (async) |
| Validation | Pydantic v2 |
| Auth | Device-based + JWT |
| Payments | Stripe |

---

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL
- uv (recommended) or pip

### Setup

```bash
cd shenbid

# Install dependencies with uv
uv sync

# Or with pip
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Create database
createdb shenbi

# Run migrations (if using Alembic)
uv run alembic upgrade head

# Start server
uv run uvicorn app.main:app --reload --port 8000
```

### API Documentation

Once running:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Project Structure

```
shenbid/
├── app/
│   ├── main.py           # FastAPI app entry
│   ├── config.py         # Environment settings
│   ├── database.py       # DB connection
│   ├── deps.py           # Dependency injection
│   ├── models/           # SQLAlchemy models
│   │   ├── user.py
│   │   ├── progress.py
│   │   ├── achievement.py
│   │   ├── session.py
│   │   ├── adventure.py
│   │   ├── settings.py
│   │   └── teacher_content.py
│   ├── routers/          # API endpoints
│   │   ├── auth.py
│   │   ├── progress.py
│   │   ├── achievements.py
│   │   ├── sessions.py
│   │   ├── adventures.py
│   │   ├── settings.py
│   │   ├── stripe.py
│   │   └── teacher_content.py
│   └── schemas/          # Pydantic schemas
│       ├── user.py
│       ├── progress.py
│       └── ...
├── tests/                # Pytest test suite
├── pyproject.toml        # Project config
├── requirements.txt      # Dependencies
└── Makefile             # Dev commands
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with device ID |
| POST | `/api/auth/login` | Login (device-based) |
| GET | `/api/auth/me` | Get current user |

**Device-based auth**: Users are identified by a unique device ID. No passwords required.

```typescript
// Frontend usage
const headers = { 'X-Device-ID': deviceId };
```

---

### Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress` | All user progress |
| GET | `/api/progress/adventure/{id}` | Adventure progress |
| GET | `/api/progress/level/{adventure_id}/{level_id}` | Level progress |
| POST | `/api/progress` | Save level completion |

**Request body (POST):**
```json
{
  "adventure_id": "maze-adventure",
  "level_id": "maze-01",
  "completed": true,
  "score": 3,
  "steps": 15,
  "code_submitted": "前进()\n前进()"
}
```

---

### Adventures

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adventures` | List all adventures |
| GET | `/api/adventures/{id}` | Get adventure details |
| POST | `/api/adventures` | Create adventure (teacher) |
| PUT | `/api/adventures/{id}` | Update adventure |
| DELETE | `/api/adventures/{id}` | Delete adventure |

---

### Achievements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/achievements` | User's achievements |
| POST | `/api/achievements/{id}` | Unlock achievement |

---

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Start play session |
| PUT | `/api/sessions/{id}` | Update session |
| GET | `/api/sessions` | Session history |

---

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update settings |

---

### Stripe (Premium)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stripe/config` | Get publishable key |
| POST | `/api/stripe/checkout` | Create checkout session |
| POST | `/api/stripe/verify` | Verify payment |
| POST | `/api/stripe/webhook` | Stripe webhooks |

---

## Data Models

### User

```python
class User(Base):
    id: UUID
    device_id: str (unique)
    display_name: str
    role: UserRole  # STUDENT, TEACHER, PARENT, ADMIN
    age: int | None
    grade: str | None

    # Subscription
    subscription_tier: str  # "free" | "premium"
    subscription_started_at: datetime | None
    subscription_expires_at: datetime | None
```

### Progress

```python
class Progress(Base):
    id: UUID
    user_id: UUID (FK)
    adventure_id: str
    level_id: str
    completed: bool
    score: int  # 1-3 stars
    steps: int
    time_spent: int  # seconds
    code_submitted: str
    hints_used: int
```

### Achievement

```python
class Achievement(Base):
    id: UUID
    user_id: UUID (FK)
    achievement_id: str  # e.g., "speed_demon", "perfect_solver"
    unlocked_at: datetime
    level_unlocked: str | None
```

---

## Development

### Run Tests

```bash
uv run pytest
```

### Database Migrations

```bash
# Initialize (first time)
uv run alembic init alembic

# Create migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback
uv run alembic downgrade -1
```

### Makefile Commands

```bash
make run       # Start dev server
make test      # Run tests
make db-reset  # Reset database
make seed      # Seed test data
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/shenbi

# Security
SECRET_KEY=your-secret-key

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Environment
ENV=development  # or production
```

---

## Dependency Injection

The `deps.py` module provides reusable dependencies:

```python
from app.deps import DB, CurrentUser

@router.get("/profile")
async def get_profile(
    db: DB,           # Async database session
    user: CurrentUser # Current authenticated user
):
    return user
```

**Auto-registration**: If a device ID doesn't exist, a new user is automatically created.

---

*See also: [Stripe Integration](./stripe.md) | [Architecture](./architecture.md)*
