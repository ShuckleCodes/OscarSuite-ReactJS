import { Router } from 'express';
import * as db from '../services/database.js';
import type { RoomCreate } from '../types/index.js';

const router = Router();

// GET /api/rooms - Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await db.getRooms();
    res.json(rooms);
  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// GET /api/rooms/:code - Get room by code
router.get('/:code', async (req, res) => {
  try {
    const room = await db.getRoomByCode(req.params.code);
    if (room) {
      res.json(room);
    } else {
      res.status(404).json({ error: 'Room not found' });
    }
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// POST /api/rooms - Create a new room
router.post('/', async (req, res) => {
  try {
    const { name, code } = req.body as RoomCreate;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const roomId = await db.createRoom(name, code);
    if (roomId) {
      res.status(201).json({ id: roomId });
    } else {
      res.status(409).json({ error: 'Room code already exists' });
    }
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// DELETE /api/rooms/:id - Delete a room
router.delete('/:id', async (req, res) => {
  try {
    await db.deleteRoom(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
