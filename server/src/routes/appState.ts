import { Router } from 'express';
import * as db from '../services/database.js';
import type { LockPredictions, SetWinner } from '../types/index.js';

const router = Router();

// GET /api/app-state - Get current app state
router.get('/', async (req, res) => {
  try {
    const state = await db.getAppState();
    res.json(state);
  } catch (error) {
    console.error('Error getting app state:', error);
    res.status(500).json({ error: 'Failed to get app state' });
  }
});

// POST /api/app-state/lock - Lock/unlock predictions
router.post('/lock', async (req, res) => {
  try {
    const { locked } = req.body as LockPredictions;
    await db.setPredictionsLocked(locked);
    res.status(200).send();
  } catch (error) {
    console.error('Error setting lock:', error);
    res.status(500).json({ error: 'Failed to set lock' });
  }
});

// POST /api/app-state/winner - Set award winner
router.post('/winner', async (req, res) => {
  try {
    const { award_id, nominee_id } = req.body as SetWinner;
    await db.setWinner(award_id, nominee_id);
    res.status(200).send();
  } catch (error) {
    console.error('Error setting winner:', error);
    res.status(500).json({ error: 'Failed to set winner' });
  }
});

// DELETE /api/app-state/winner/:awardId - Clear winner for an award
router.delete('/winner/:awardId', async (req, res) => {
  try {
    await db.clearWinner(parseInt(req.params.awardId));
    res.status(204).send();
  } catch (error) {
    console.error('Error clearing winner:', error);
    res.status(500).json({ error: 'Failed to clear winner' });
  }
});

// POST /api/app-state/reset - Reset app state
router.post('/reset', async (req, res) => {
  try {
    await db.resetAppState();
    res.status(200).send();
  } catch (error) {
    console.error('Error resetting app state:', error);
    res.status(500).json({ error: 'Failed to reset app state' });
  }
});

export default router;
