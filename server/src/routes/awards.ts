import { Router } from 'express';
import * as db from '../services/database.js';

const router = Router();

// GET /api/awards - Get all awards with nominees
router.get('/', async (req, res) => {
  try {
    const awards = await db.getAwards();
    res.json(awards);
  } catch (error) {
    console.error('Error getting awards:', error);
    res.status(500).json({ error: 'Failed to get awards' });
  }
});

export default router;
