const express = require('express');
const pool = require('../config/database');
const { getBuildings, createBuilding, updateBuilding, deleteBuilding } = require('../models/dbQueries');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /api/buildings
router.get('/', async (req, res) => {
  try {
    const buildings = await getBuildings();
    res.json(buildings);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({ message: 'Server error fetching buildings' });
  }
});

// POST /api/buildings (Admin only)
router.post(
  '/',
  verifyToken,
  isAdmin,
  [
    body('name').trim().notEmpty().withMessage('Building name is required').isLength({ max: 100 }).withMessage('Name too long')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    try {
      const building = await createBuilding(name);

      // Reset sequence to max id + 1 after insert
      await pool.query(`SELECT setval('buildings_id_seq', (SELECT MAX(id) FROM buildings) + 1)`);

      res.status(201).json({ message: 'Building created successfully', building });
    } catch (error) {
      console.error('Error creating building:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ message: 'Building with this name already exists' });
      }
      res.status(500).json({ message: 'Server error creating building' });
    }
  }
);

// PUT /api/buildings/:id (Admin only)
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  [
    body('name').trim().notEmpty().withMessage('Building name is required').isLength({ max: 100 }).withMessage('Name too long')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = parseInt(req.params.id);
    const { name } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid building ID' });
    }

    try {
      const building = await updateBuilding(id, name);
      if (!building) {
        return res.status(404).json({ message: 'Building not found' });
      }
      res.json({ message: 'Building updated successfully', building });
    } catch (error) {
      console.error('Error updating building:', error);
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Building with this name already exists' });
      }
      res.status(500).json({ message: 'Server error updating building' });
    }
  }
);

// DELETE /api/buildings/:id (Admin only)
router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid building ID' });
    }

    try {
      await deleteBuilding(id);
      res.json({ message: 'Building deleted successfully' });
    } catch (error) {
      console.error('Error deleting building:', error);
      res.status(500).json({ message: 'Server error deleting building' });
    }
  }
);

module.exports = router;
