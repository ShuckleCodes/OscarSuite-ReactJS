import { Router } from 'express';
import * as db from '../services/database.js';
import type { GuestCreate, GuestUpdate } from '../types/index.js';

const router = Router();

// GET /api/guests - Get all guests (with optional room filter)
router.get('/', async (req, res) => {
  try {
    const roomCode = req.query.room as string | undefined;
    const guests = await db.getGuests(roomCode);
    res.json(guests);
  } catch (error) {
    console.error('Error getting guests:', error);
    res.status(500).json({ error: 'Failed to get guests' });
  }
});

// GET /api/guests-with-scores - Get guests with calculated scores
router.get('/with-scores', async (req, res) => {
  try {
    const roomCode = req.query.room as string | undefined;
    const guests = await db.getGuestsWithScores(roomCode);
    res.json(guests);
  } catch (error) {
    console.error('Error getting guests with scores:', error);
    res.status(500).json({ error: 'Failed to get guests with scores' });
  }
});

// GET /api/guests/:id - Get a single guest
router.get('/:id', async (req, res) => {
  try {
    const guest = await db.getGuestById(parseInt(req.params.id));
    if (guest) {
      res.json(guest);
    } else {
      res.status(404).json({ error: 'Guest not found' });
    }
  } catch (error) {
    console.error('Error getting guest:', error);
    res.status(500).json({ error: 'Failed to get guest' });
  }
});

// POST /api/guests - Create a new guest
router.post('/', async (req, res) => {
  try {
    const { name, photo, predictions, rooms } = req.body as GuestCreate;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const guestId = await db.createGuest(
      name,
      photo || '',
      predictions || {},
      rooms || []
    );
    res.status(201).json({ id: guestId });
  } catch (error) {
    console.error('Error creating guest:', error);
    res.status(500).json({ error: 'Failed to create guest' });
  }
});

// PUT /api/guests/:id - Update a guest
router.put('/:id', async (req, res) => {
  try {
    const { name, photo, predictions, rooms } = req.body as GuestUpdate;
    await db.updateGuest(parseInt(req.params.id), { name, photo, predictions, rooms });
    res.status(200).send();
  } catch (error) {
    console.error('Error updating guest:', error);
    res.status(500).json({ error: 'Failed to update guest' });
  }
});

// DELETE /api/guests/:id - Delete a guest
router.delete('/:id', async (req, res) => {
  try {
    await db.deleteGuest(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting guest:', error);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});

// DELETE /api/guests - Clear all guests
router.delete('/', async (req, res) => {
  try {
    await db.clearGuests();
    res.status(204).send();
  } catch (error) {
    console.error('Error clearing guests:', error);
    res.status(500).json({ error: 'Failed to clear guests' });
  }
});

export default router;
