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

// GET /api/awards/:id - Get single award
router.get('/:id', async (req, res) => {
  try {
    const awardId = parseInt(req.params.id, 10);
    if (isNaN(awardId)) {
      return res.status(400).json({ error: 'Invalid award ID' });
    }

    const award = await db.getAwardById(awardId);
    if (!award) {
      return res.status(404).json({ error: 'Award not found' });
    }

    res.json(award);
  } catch (error) {
    console.error('Error getting award:', error);
    res.status(500).json({ error: 'Failed to get award' });
  }
});

// POST /api/awards - Create award
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const award = await db.createAward({ name });
    res.status(201).json(award);
  } catch (error) {
    console.error('Error creating award:', error);
    res.status(500).json({ error: 'Failed to create award' });
  }
});

// PUT /api/awards/:id - Update award
router.put('/:id', async (req, res) => {
  try {
    const awardId = parseInt(req.params.id, 10);
    if (isNaN(awardId)) {
      return res.status(400).json({ error: 'Invalid award ID' });
    }

    const { name, nominees } = req.body;
    const award = await db.updateAward(awardId, { name, nominees });

    if (!award) {
      return res.status(404).json({ error: 'Award not found' });
    }

    res.json(award);
  } catch (error) {
    console.error('Error updating award:', error);
    res.status(500).json({ error: 'Failed to update award' });
  }
});

// DELETE /api/awards/:id - Delete award
router.delete('/:id', async (req, res) => {
  try {
    const awardId = parseInt(req.params.id, 10);
    if (isNaN(awardId)) {
      return res.status(400).json({ error: 'Invalid award ID' });
    }

    const deleted = await db.deleteAward(awardId);
    if (!deleted) {
      return res.status(404).json({ error: 'Award not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting award:', error);
    res.status(500).json({ error: 'Failed to delete award' });
  }
});

// POST /api/awards/:id/nominees - Add nominee to award
router.post('/:id/nominees', async (req, res) => {
  try {
    const awardId = parseInt(req.params.id, 10);
    if (isNaN(awardId)) {
      return res.status(400).json({ error: 'Invalid award ID' });
    }

    const { name, image } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const nominee = await db.createNominee(awardId, { name, image });
    if (!nominee) {
      return res.status(404).json({ error: 'Award not found' });
    }

    res.status(201).json(nominee);
  } catch (error) {
    console.error('Error creating nominee:', error);
    res.status(500).json({ error: 'Failed to create nominee' });
  }
});

// PUT /api/awards/:awardId/nominees/:nomineeId - Update nominee
router.put('/:awardId/nominees/:nomineeId', async (req, res) => {
  try {
    const awardId = parseInt(req.params.awardId, 10);
    const nomineeId = parseInt(req.params.nomineeId, 10);

    if (isNaN(awardId) || isNaN(nomineeId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const { name, image } = req.body;
    const nominee = await db.updateNominee(awardId, nomineeId, { name, image });

    if (!nominee) {
      return res.status(404).json({ error: 'Award or nominee not found' });
    }

    res.json(nominee);
  } catch (error) {
    console.error('Error updating nominee:', error);
    res.status(500).json({ error: 'Failed to update nominee' });
  }
});

// DELETE /api/awards/:awardId/nominees/:nomineeId - Delete nominee
router.delete('/:awardId/nominees/:nomineeId', async (req, res) => {
  try {
    const awardId = parseInt(req.params.awardId, 10);
    const nomineeId = parseInt(req.params.nomineeId, 10);

    if (isNaN(awardId) || isNaN(nomineeId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const deleted = await db.deleteNominee(awardId, nomineeId);
    if (!deleted) {
      return res.status(404).json({ error: 'Award or nominee not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting nominee:', error);
    res.status(500).json({ error: 'Failed to delete nominee' });
  }
});

export default router;
