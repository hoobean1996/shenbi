# Real-time API Requirements

## Overview

Replace WebRTC-based peer-to-peer communication with polling-based REST APIs for Battle and Classroom features. This provides better reliability, especially for users behind firewalls (schools, corporate networks).

**Polling Strategy:**
- Clients poll every 500ms-1000ms for state updates
- All state is server-authoritative
- No WebSocket/WebRTC needed

---

## Part 1: Battle Mode APIs

Battle mode is a 1v1 race where two players compete to complete a level first.

### 1.1 Create Battle Room

**Host creates a new battle room.**

```
POST /api/v1/shenbi/battles
```

**Request:**
```json
{
  "player_name": "Alice"
}
```

**Response (201 Created):**
```json
{
  "id": 12345,
  "room_code": "ABCDEF",
  "host_id": 100,
  "host_name": "Alice",
  "guest_id": null,
  "guest_name": null,
  "status": "waiting",
  "level": null,
  "host_completed": false,
  "guest_completed": false,
  "winner_id": null,
  "created_at": "2024-01-10T10:00:00Z",
  "expires_at": "2024-01-10T11:00:00Z"
}
```

**Status Values:**
- `waiting` - Host created room, waiting for guest
- `ready` - Both players joined, waiting for host to start
- `playing` - Game in progress
- `finished` - Game ended, winner determined
- `expired` - Room expired (1 hour timeout)

---

### 1.2 Join Battle Room

**Guest joins an existing battle room by code.**

```
POST /api/v1/shenbi/battles/join
```

**Request:**
```json
{
  "room_code": "ABCDEF",
  "player_name": "Bob"
}
```

**Response (200 OK):**
```json
{
  "id": 12345,
  "room_code": "ABCDEF",
  "host_id": 100,
  "host_name": "Alice",
  "guest_id": 101,
  "guest_name": "Bob",
  "status": "ready",
  "level": null,
  "host_completed": false,
  "guest_completed": false,
  "winner_id": null,
  "created_at": "2024-01-10T10:00:00Z",
  "expires_at": "2024-01-10T11:00:00Z"
}
```

**Error Responses:**
- `404` - Room not found or expired
- `409` - Room already full (guest already joined)

---

### 1.3 Get Battle Room State

**Both players poll this endpoint for updates.**

```
GET /api/v1/shenbi/battles/{room_code}
```

**Response (200 OK):**
```json
{
  "id": 12345,
  "room_code": "ABCDEF",
  "host_id": 100,
  "host_name": "Alice",
  "guest_id": 101,
  "guest_name": "Bob",
  "status": "playing",
  "level": {
    "id": "level-1",
    "name": "First Steps",
    "game_type": "maze",
    "grid": ["...", "..."],
    "available_commands": ["forward", "turn_left"],
    "win_condition": { "type": "reach_goal" }
  },
  "host_completed": false,
  "host_completed_at": null,
  "guest_completed": true,
  "guest_completed_at": "2024-01-10T10:05:30Z",
  "winner_id": 101,
  "created_at": "2024-01-10T10:00:00Z",
  "expires_at": "2024-01-10T11:00:00Z"
}
```

**Note:** Level data is only populated after host calls "start".

---

### 1.4 Start Battle (Host Only)

**Host sets the level and starts the game.**

```
POST /api/v1/shenbi/battles/{room_code}/start
```

**Request:**
```json
{
  "level": {
    "id": "level-1",
    "name": "First Steps",
    "game_type": "maze",
    "grid": ["#.#.#", "#...#", "#.G.#"],
    "available_commands": ["forward", "turn_left", "turn_right"],
    "available_sensors": ["is_wall_ahead"],
    "win_condition": { "type": "reach_goal" },
    "fail_condition": null
  }
}
```

**Response (200 OK):**
```json
{
  "id": 12345,
  "room_code": "ABCDEF",
  "status": "playing",
  "level": { ... },
  "started_at": "2024-01-10T10:02:00Z"
}
```

**Error Responses:**
- `403` - Not the host
- `409` - Guest hasn't joined yet, or game already started

---

### 1.5 Mark Completion

**Player marks themselves as completed.**

```
POST /api/v1/shenbi/battles/{room_code}/complete
```

**Request:**
```json
{
  "code": "forward(); turn_left(); forward();"
}
```

**Response (200 OK):**
```json
{
  "id": 12345,
  "room_code": "ABCDEF",
  "status": "finished",
  "host_completed": true,
  "host_completed_at": "2024-01-10T10:05:45Z",
  "guest_completed": true,
  "guest_completed_at": "2024-01-10T10:05:30Z",
  "winner_id": 101,
  "winner_name": "Bob"
}
```

**Winner Logic:**
- First player to complete wins
- If both complete in same request (race condition), earlier `completed_at` wins

---

### 1.6 Leave Battle

**Player leaves the battle room.**

```
POST /api/v1/shenbi/battles/{room_code}/leave
```

**Response (200 OK):**
```json
{
  "message": "Left battle room"
}
```

**Side Effects:**
- If host leaves before game starts: room is deleted
- If any player leaves during game: other player wins by forfeit

---

## Part 2: Classroom Live Session APIs

Classroom mode allows a teacher to run a live coding session with multiple students.

### 2.1 Start Live Session (Teacher)

**Teacher starts a live session for an existing classroom.**

```
POST /api/v1/shenbi/classrooms/{classroom_id}/live
```

**Request:**
```json
{}
```

**Response (201 Created):**
```json
{
  "id": 5001,
  "classroom_id": 200,
  "room_code": "XYZABC",
  "teacher_id": 100,
  "teacher_name": "Mr. Smith",
  "status": "waiting",
  "level": null,
  "started_at": null,
  "students": [],
  "created_at": "2024-01-10T10:00:00Z",
  "expires_at": "2024-01-10T12:00:00Z"
}
```

**Status Values:**
- `waiting` - Session created, waiting for students or level
- `ready` - Level set, waiting to start
- `playing` - Game in progress
- `ended` - Session ended by teacher

---

### 2.2 Join Live Session (Student)

**Student joins an active live session.**

```
POST /api/v1/shenbi/classrooms/{classroom_id}/live/join
```

**Request:**
```json
{
  "student_name": "Tommy"
}
```

**Response (200 OK):**
```json
{
  "id": 5001,
  "classroom_id": 200,
  "room_code": "XYZABC",
  "teacher_id": 100,
  "teacher_name": "Mr. Smith",
  "status": "waiting",
  "level": null,
  "started_at": null,
  "my_progress": {
    "student_id": 102,
    "student_name": "Tommy",
    "stars_collected": 0,
    "completed": false,
    "completed_at": null
  },
  "created_at": "2024-01-10T10:00:00Z",
  "expires_at": "2024-01-10T12:00:00Z"
}
```

**Error Responses:**
- `404` - No active live session for this classroom
- `403` - Student not enrolled in this classroom

---

### 2.3 Get Live Session State

**Both teacher and students poll this for updates.**

```
GET /api/v1/shenbi/classrooms/{classroom_id}/live
```

**Response for Teacher (200 OK):**
```json
{
  "id": 5001,
  "classroom_id": 200,
  "room_code": "XYZABC",
  "teacher_id": 100,
  "teacher_name": "Mr. Smith",
  "status": "playing",
  "level": {
    "id": "level-1",
    "name": "First Steps",
    "game_type": "maze",
    "grid": ["#.#.#", "#...#", "#.G.#"],
    "available_commands": ["forward", "turn_left"]
  },
  "started_at": "2024-01-10T10:05:00Z",
  "students": [
    {
      "student_id": 102,
      "student_name": "Tommy",
      "joined_at": "2024-01-10T10:02:00Z",
      "stars_collected": 2,
      "completed": false,
      "completed_at": null,
      "last_updated_at": "2024-01-10T10:06:30Z"
    },
    {
      "student_id": 103,
      "student_name": "Sarah",
      "joined_at": "2024-01-10T10:03:00Z",
      "stars_collected": 3,
      "completed": true,
      "completed_at": "2024-01-10T10:06:00Z",
      "last_updated_at": "2024-01-10T10:06:00Z"
    }
  ],
  "summary": {
    "total_students": 2,
    "completed_count": 1,
    "average_stars": 2.5
  },
  "created_at": "2024-01-10T10:00:00Z",
  "expires_at": "2024-01-10T12:00:00Z"
}
```

**Response for Student (200 OK):**
```json
{
  "id": 5001,
  "classroom_id": 200,
  "room_code": "XYZABC",
  "teacher_name": "Mr. Smith",
  "status": "playing",
  "level": {
    "id": "level-1",
    "name": "First Steps",
    "game_type": "maze",
    "grid": ["#.#.#", "#...#", "#.G.#"],
    "available_commands": ["forward", "turn_left"]
  },
  "started_at": "2024-01-10T10:05:00Z",
  "my_progress": {
    "student_id": 102,
    "student_name": "Tommy",
    "stars_collected": 2,
    "completed": false,
    "completed_at": null
  },
  "peer_summary": {
    "total_students": 2,
    "completed_count": 1
  },
  "created_at": "2024-01-10T10:00:00Z"
}
```

**Note:** Students only see their own progress + summary, not other students' details.

---

### 2.4 Set Level (Teacher Only)

**Teacher sets the level for the session.**

```
PUT /api/v1/shenbi/classrooms/{classroom_id}/live/level
```

**Request:**
```json
{
  "level": {
    "id": "level-1",
    "name": "First Steps",
    "game_type": "maze",
    "grid": ["#.#.#", "#...#", "#.G.#"],
    "available_commands": ["forward", "turn_left", "turn_right"],
    "available_sensors": ["is_wall_ahead"],
    "win_condition": { "type": "reach_goal" }
  }
}
```

**Response (200 OK):**
```json
{
  "id": 5001,
  "status": "ready",
  "level": { ... }
}
```

---

### 2.5 Start Session (Teacher Only)

**Teacher starts the game for all students.**

```
POST /api/v1/shenbi/classrooms/{classroom_id}/live/start
```

**Response (200 OK):**
```json
{
  "id": 5001,
  "status": "playing",
  "started_at": "2024-01-10T10:05:00Z"
}
```

**Error Responses:**
- `409` - Level not set yet

---

### 2.6 Reset Session (Teacher Only)

**Teacher resets all student progress (replay same level).**

```
POST /api/v1/shenbi/classrooms/{classroom_id}/live/reset
```

**Response (200 OK):**
```json
{
  "id": 5001,
  "status": "ready",
  "started_at": null,
  "students": [
    {
      "student_id": 102,
      "student_name": "Tommy",
      "stars_collected": 0,
      "completed": false
    }
  ]
}
```

---

### 2.7 Update Progress (Student Only)

**Student updates their progress during the game.**

```
PUT /api/v1/shenbi/classrooms/{classroom_id}/live/progress
```

**Request:**
```json
{
  "stars_collected": 2,
  "completed": false,
  "code": "forward(); forward();"
}
```

**Response (200 OK):**
```json
{
  "student_id": 102,
  "stars_collected": 2,
  "completed": false,
  "last_updated_at": "2024-01-10T10:06:30Z"
}
```

**Note:** Students should call this:
- When collecting a star
- When completing the level
- Optionally every few seconds during play (for live view)

---

### 2.8 End Session (Teacher Only)

**Teacher ends the live session.**

```
POST /api/v1/shenbi/classrooms/{classroom_id}/live/end
```

**Response (200 OK):**
```json
{
  "id": 5001,
  "status": "ended",
  "ended_at": "2024-01-10T10:30:00Z",
  "summary": {
    "total_students": 2,
    "completed_count": 2,
    "average_stars": 2.8
  }
}
```

---

### 2.9 Leave Session (Student Only)

**Student leaves the live session.**

```
POST /api/v1/shenbi/classrooms/{classroom_id}/live/leave
```

**Response (200 OK):**
```json
{
  "message": "Left session"
}
```

---

## Part 3: Alternative - Join by Room Code

For convenience, allow joining by room code without knowing classroom ID.

### 3.1 Join Live Session by Code

```
POST /api/v1/shenbi/live/join
```

**Request:**
```json
{
  "room_code": "XYZABC",
  "student_name": "Tommy"
}
```

**Response (200 OK):**
```json
{
  "classroom_id": 200,
  "session": { ... }
}
```

**Error Responses:**
- `404` - Room code not found or expired

---

## Data Models Summary

### BattleRoom
```
id: number
room_code: string (6 chars, unique, uppercase)
host_id: number (user ID)
host_name: string
guest_id: number | null
guest_name: string | null
status: enum (waiting, ready, playing, finished, expired)
level: JSON | null
host_completed: boolean
host_completed_at: timestamp | null
guest_completed: boolean
guest_completed_at: timestamp | null
winner_id: number | null
created_at: timestamp
expires_at: timestamp (created_at + 1 hour)
```

### LiveSession
```
id: number
classroom_id: number (FK)
room_code: string (6 chars, unique, uppercase)
teacher_id: number (user ID)
status: enum (waiting, ready, playing, ended)
level: JSON | null
started_at: timestamp | null
ended_at: timestamp | null
created_at: timestamp
expires_at: timestamp (created_at + 2 hours)
```

### LiveSessionStudent
```
id: number
session_id: number (FK)
student_id: number (user ID)
student_name: string
joined_at: timestamp
left_at: timestamp | null
stars_collected: number (default 0)
completed: boolean (default false)
completed_at: timestamp | null
code: text | null
last_updated_at: timestamp
```

---

## Polling Recommendations

| Feature | Polling Interval | Endpoint |
|---------|------------------|----------|
| Battle: waiting for opponent | 1000ms | `GET /battles/{code}` |
| Battle: during game | 500ms | `GET /battles/{code}` |
| Classroom: teacher dashboard | 1000ms | `GET /classrooms/{id}/live` |
| Classroom: student waiting | 1000ms | `GET /classrooms/{id}/live` |
| Classroom: student playing | 2000ms | `GET /classrooms/{id}/live` |

---

## Migration Notes

1. These APIs replace WebRTC (PeerJS) communication
2. Existing `sessionsApi` can be deprecated or kept for backward compatibility
3. Room codes should use same format: 6 uppercase letters excluding I, O
4. All endpoints require authentication via access token
