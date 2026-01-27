# Oscar Suite (React.js + Node.js)

A web-based application for hosting Oscar prediction parties. Guests submit their predictions for Academy Award winners, and the app displays nominees, tracks scores, and shows a live leaderboard as winners are announced.

## Tech Stack

- **Backend:** Node.js + Express + Socket.io
- **Database:** lowdb (JSON file-based)
- **Frontend:** React 18 + Material UI + Framer Motion
- **Build Tool:** Vite

## Project Structure

```
OscarSuiteReactJS/
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Database operations
│   │   ├── websocket/      # Socket.io handlers
│   │   └── types/          # TypeScript interfaces
│   └── data/               # Static files & databases
│       ├── db/             # JSON databases
│       ├── nominees/       # Nominee images
│       ├── guests/         # Guest photos
│       └── backgrounds/    # Background images
│
└── client/                 # React frontend
    └── src/
        ├── pages/          # GuestPage, AdminPage, DisplayPage
        ├── components/     # UI components
        ├── hooks/          # React Query hooks
        ├── context/        # Socket context
        ├── api/            # API client
        └── styles/         # Theme & CSS
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Install client dependencies:**
   ```bash
   cd client
   npm install
   ```

### Development

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```
   Server runs on http://localhost:8001

2. **Start the frontend dev server:**
   ```bash
   cd client
   npm run dev
   ```
   Client runs on http://localhost:3000

### URLs

- **Guest Page:** http://localhost:3000/guest - Submit predictions
- **Admin Page:** http://localhost:3000/admin - Control panel
- **Display Page:** http://localhost:3000/display - Audience screen

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/awards` | Get all awards with nominees |
| GET | `/api/guests` | Get guests (optional `?room=` filter) |
| GET | `/api/guests/with-scores` | Get guests with calculated scores |
| POST | `/api/guests` | Create guest |
| PUT | `/api/guests/:id` | Update guest |
| DELETE | `/api/guests/:id` | Delete guest |
| GET | `/api/rooms` | Get all rooms |
| POST | `/api/rooms` | Create room |
| DELETE | `/api/rooms/:id` | Delete room |
| GET | `/api/app-state` | Get lock status & winners |
| POST | `/api/app-state/lock` | Lock/unlock predictions |
| POST | `/api/app-state/winner` | Set award winner |
| POST | `/api/upload/photo` | Upload guest photo |

## WebSocket Events

Messages are sent in format: `action+++param1+++param2`

- `showAward+++{id}` - Display nominees for an award
- `selectWinner+++{awardId}+++{nomineeId}` - Mark winner
- `showScoreboard` - Show leaderboard with animated scores
- `showLogo` - Return to logo screen
- `lockPredictions` / `unlockPredictions` - Toggle prediction lock
- `guestSubmitted+++{id}+++{name}` - Notify when guest submits
- `roomsUpdated` - Notify when rooms are updated

## Features

### Guest Page
- Select your name from dropdown or create a new guest
- Upload a profile photo
- Make predictions for each award category
- Progress bar shows completion percentage
- Submit button saves predictions

### Admin Page
- Display controls: Show Logo, Show Scoreboard, Show Award
- Select winners for each category
- Lock/unlock predictions
- Manage rooms (create/delete)
- View all guests with scores and predictions
- Delete individual guests or clear all

### Display Page
- **Logo Screen:** Animated Oscar logo with random category cycling
- **Award Screen:** Nominees appear with 2-second stagger, predictor avatars show who picked each
- **Scoreboard Screen:** Animated score counting, guest cards reorder by score, detailed prediction table slides up

## Animations

All animations use Framer Motion:
- Nominee cards: 2-second stagger on appearance
- Predictor avatars: 100ms stagger after all nominees appear
- Winner card: Scale up + gold glow animation
- Score counter: Animated from 0 to value over 2 seconds
- Guest cards: Smooth repositioning when scores change
- Scores table: Slides up from bottom after 5 seconds
