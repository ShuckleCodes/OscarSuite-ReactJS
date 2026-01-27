import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { setupWebSocket } from './websocket/index.js';

// Import routes
import awardsRouter from './routes/awards.js';
import roomsRouter from './routes/rooms.js';
import guestsRouter from './routes/guests.js';
import appStateRouter from './routes/appState.js';
import uploadRouter from './routes/upload.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from data directory
const dataDir = path.join(process.cwd(), 'data');
app.use('/data', express.static(dataDir));

// API routes
app.use('/api/awards', awardsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/guests', guestsRouter);
app.use('/api/app-state', appStateRouter);
app.use('/api/upload', uploadRouter);

// Legacy route aliases (for compatibility with existing clients)
app.use('/data/awards', awardsRouter);
app.use('/data/rooms', roomsRouter);
app.use('/data/guests', guestsRouter);
app.get('/data/guests_with_scores', async (req, res) => {
  // Forward to the new endpoint
  const roomCode = req.query.room as string | undefined;
  const url = roomCode ? `/api/guests/with-scores?room=${roomCode}` : '/api/guests/with-scores';
  res.redirect(307, url);
});
app.use('/data/app_state', appStateRouter);
app.use('/upload', uploadRouter);

// Setup WebSocket
const io = setupWebSocket(httpServer);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  // On cPanel, frontend is served separately via Apache
  // Only handle API routes and static data files
  // React routing is handled by .htaccess in public_html

  // If PUBLIC_HTML_PATH is set, serve static files from there
  const publicHtmlPath = process.env.PUBLIC_HTML_PATH;
  if (publicHtmlPath) {
    app.use(express.static(publicHtmlPath));

    // Handle React routing for non-API routes
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api') || req.path.startsWith('/data') || req.path.startsWith('/upload') || req.path.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(publicHtmlPath, 'index.html'));
    });
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Oscar Suite Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
