# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
# Install all dependencies (both client and server)
npm run install:all

# Development - run these in separate terminals:
cd server && npm run dev    # Backend on http://localhost:8001
cd client && npm run dev    # Frontend on http://localhost:3000

# Production builds
cd client && npm run build  # Build frontend (outputs to client/dist/)
cd server && npm run build  # Build backend (outputs to server/dist/)

# Start production server
npm start  # Runs from root, serves built client
```

## Architecture

### Monorepo Structure
- **client/** - React 18 + Vite + TypeScript frontend
- **server/** - Node.js + Express + TypeScript backend
- Root package.json contains convenience scripts that delegate to subprojects

### Backend (server/)
- **Entry:** `src/index.ts` - Express server with Socket.io, serves static files from `../client/dist` in production
- **Database:** lowdb (JSON files in `data/db/`) - guests.json, rooms.json, appState.json
- **Static assets:** `data/nominees/`, `data/guests/`, `data/backgrounds/`
- **Routes:** REST API in `src/routes/` - awards, guests, rooms, appState, upload
- **Real-time:** Socket.io in `src/websocket/` broadcasts display commands to all clients

### Frontend (client/)
- **Routing:** React Router with three main pages:
  - `/guest` - Prediction submission interface
  - `/admin` - Host control panel (display controls, winner selection, guest management)
  - `/display` - Audience-facing screen (Logo/Award/Scoreboard views)
- **State:** React Query for server data, Socket.io context for real-time updates
- **UI:** Material UI components, Framer Motion animations
- **Display screens:** `components/display/` - LogoScreen, AwardScreen, ScoreboardScreen

### WebSocket Protocol
Messages use `+++` delimiter format: `action+++param1+++param2`
- Display commands: `showAward+++{id}`, `showScoreboard`, `showLogo`
- State changes: `selectWinner+++{awardId}+++{nomineeId}`, `lockPredictions`

### Key TypeScript Settings
- Client: `noUnusedLocals: true`, `noUnusedParameters: true` - remove unused code before building
- Server: `module: NodeNext` - uses .js extensions in imports for ESM compatibility

## Deployment Notes

For flat hosting (WHC.ca style):
- Use `build-whc.bat` to create deployment folder with flat structure
- Client dist contents go in root, server dist goes in `dist/` subfolder
- `package.server.json` provides minimal dependencies for production server
