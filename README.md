# Awards Show Suite (React.js + Node.js)

A web-based application for hosting awards show prediction parties. Guests submit their predictions for award winners, and the app displays nominees, tracks scores, and shows a live scoreboard as winners are announced.

Works with any awards show - customize the categories and nominees in `awards.json`.

## Tech Stack

- **Backend:** Node.js + Express + Socket.io
- **Database:** lowdb (JSON file-based)
- **Frontend:** React 18 + Material UI + Framer Motion
- **Build Tool:** Vite

## Project Structure

```
AwardsShowSuite/
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

- Node.js 18+ (20 LTS recommended)
- npm

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

3. **Set up images (not included in repo):**

   Create the following directories and add your own images:
   ```
   server/data/nominees/      # Nominee photos (referenced in awards.json)
   server/data/backgrounds/   # Background images:
                              #   - bg-logo.png
                              #   - bg-award.png
                              #   - bg-scoreboard.png
                              #   - trophy.png (default guest avatar)
   ```

4. **Update awards data:**

   Edit `server/data/awards.json` to match your nominee images and award categories.

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

- `/guest` - Guest prediction page
- `/admin` - Admin control panel
- `/display` - Audience display screen (for TV/projector)

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

### Guest Page (`/guest`)
- Select your name from dropdown
- Upload a profile photo
- Make predictions for each award category
- Progress bar shows completion percentage
- Submit button saves predictions

### Admin Page (`/admin`)
- **Display controls:** Show Logo, Show Scoreboard, Show Award
- **Guest management:** Create guests, edit room assignments, delete guests
- **Winner selection:** Select winners for each category
- **Settings:** Lock/unlock predictions
- **Room management:** Create/delete rooms
- **Guest table:** View all guests with scores and predictions for all categories

### Display Page (`/display`)
- **Logo Screen:** Title with random category preview cycling every 40 seconds
- **Award Screen:** Nominees appear with 2-second stagger, predictor avatars show who picked each nominee
- **Scoreboard Screen:** Scores animate from previous values, guest cards smoothly reorder, detailed prediction table slides up after 5 seconds
- **Responsive:** All screens adapt to different resolutions using viewport-based sizing
- **Customizable backgrounds:** Place images in `server/data/backgrounds/`:
  - `bg-logo.png` - Logo screen background
  - `bg-award.png` - Award screen background
  - `bg-scoreboard.png` - Scoreboard background

## Animations

All animations use Framer Motion:
- Nominee cards: 2-second stagger on appearance
- Predictor avatars: 100ms stagger after all nominees appear
- Winner card: Scale up + gold glow animation
- Score counter: Animates from previous score to new score over 2 seconds
- Guest cards: Smooth repositioning when scores change (layout animation)
- Scores table: Slides up from bottom after 5 seconds

## Responsive Design

- Nominee images use viewport-based sizing (vw units)
- Categories with more than 5 nominees automatically split into 2 rows
- All images maintain 2:3 aspect ratio
- Font sizes use `clamp()` for responsive scaling
- Guest cards on scoreboard scale based on number of guests

## Customization

To use this for any awards show:

1. Edit `server/data/awards.json` with your categories and nominees
2. Add nominee images to `server/data/nominees/`
3. Customize background images in `server/data/backgrounds/`
4. Update the title in `client/src/components/display/LogoScreen.tsx` if desired
