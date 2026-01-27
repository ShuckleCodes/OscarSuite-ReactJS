import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import * as db from '../services/database.js';

export function setupWebSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Handle incoming messages
    socket.on('message', async (data: string) => {
      console.log('Received message:', data);

      const parts = data.split('+++');
      const action = parts[0];

      // Handle specific actions
      if (action === '__ping__') {
        socket.emit('message', '__pong__');
        return;
      }

      // Lock/unlock predictions
      if (action === 'lockPredictions') {
        await db.setPredictionsLocked(true);
      } else if (action === 'unlockPredictions') {
        await db.setPredictionsLocked(false);
      }

      // Set current award
      if (action === 'setCurrentAward' && parts.length > 1) {
        const awardId = parts[1] ? parseInt(parts[1]) : null;
        await db.setCurrentAward(awardId);
      }

      // Select winner
      if (action === 'selectWinner' && parts.length >= 3) {
        const awardId = parseInt(parts[1]);
        const nomineeId = parseInt(parts[2]);
        await db.setWinner(awardId, nomineeId);
      }

      // Broadcast to all clients (including sender)
      io.emit('message', data);
    });

    // Socket.io event aliases for cleaner client code
    socket.on('showAward', (awardId: number) => {
      io.emit('message', `showAward+++${awardId}`);
    });

    socket.on('showScoreboard', () => {
      io.emit('message', 'showScoreboard');
    });

    socket.on('showLogo', () => {
      io.emit('message', 'showLogo');
    });

    socket.on('selectWinner', async (awardId: number, nomineeId: number) => {
      await db.setWinner(awardId, nomineeId);
      io.emit('message', `selectWinner+++${awardId}+++${nomineeId}`);
    });

    socket.on('clearWinner', async (awardId: number) => {
      await db.clearWinner(awardId);
      io.emit('message', `clearWinner+++${awardId}`);
    });

    socket.on('lockPredictions', async () => {
      await db.setPredictionsLocked(true);
      io.emit('message', 'lockPredictions');
    });

    socket.on('unlockPredictions', async () => {
      await db.setPredictionsLocked(false);
      io.emit('message', 'unlockPredictions');
    });

    socket.on('guestSubmitted', (guestId: number, guestName: string) => {
      io.emit('message', `guestSubmitted+++${guestId}+++${guestName}`);
    });

    socket.on('guestsUpdated', () => {
      io.emit('message', 'guestsUpdated');
    });

    socket.on('roomsUpdated', () => {
      io.emit('message', 'roomsUpdated');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
