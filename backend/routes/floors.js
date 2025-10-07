const express = require('express');
const pool = require('../config/database');
const { getFloors, getAllFloors, createFloor, updateFloor, deleteFloor } = require('../models/dbQueries');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /api/floors?buildingId=:id
router.get('/', async (req, res) => {
  const { buildingId } = req.query;
  if (!buildingId) {
    return res.status(400).json({ message: 'buildingId query parameter is required' });
  }

  try {
    const floors = await getFloors(buildingId);
    res.json(floors);
  } catch (error) {
    console.error('Error fetching floors:', error);
    res.status(500).json({ message: 'Server error fetching floors' });
  }
});

// GET /api/floors/all (Admin only)
router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const floors = await getAllFloors();
    res.json(floors);
  } catch (error) {
    console.error('Error fetching all floors:', error);
    res.status(500).json({ message: 'Server error fetching floors' });
  }
});

// POST /api/floors (Admin only)
router.post(
  '/',
  verifyToken,
  isAdmin,
  [
    body('buildingId').isInt().withMessage('Valid building ID required'),
    body('floorNumber').isInt({ min: 1 }).withMessage('Floor number must be a positive integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { buildingId, floorNumber } = req.body;

    try {
      const floor = await createFloor(buildingId, floorNumber);

      // Reset sequence to max id + 1 after insert
      await pool.query(`SELECT setval('floors_id_seq', (SELECT MAX(id) FROM floors) + 1)`);

      res.status(201).json({ message: 'Floor created successfully', floor });
    } catch (error) {
      console.error('Error creating floor:', error);
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ message: 'Invalid building ID' });
      }
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ message: 'Floor number already exists in this building' });
      }
      res.status(500).json({ message: 'Server error creating floor' });
    }
  }
);

// PUT /api/floors/:id (Admin only)
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  [
    body('buildingId').isInt().withMessage('Valid building ID required'),
    body('floorNumber').isInt({ min: 1 }).withMessage('Floor number must be a positive integer')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = parseInt(req.params.id);
    const { buildingId, floorNumber } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid floor ID' });
    }

    try {
      const floor = await updateFloor(id, buildingId, floorNumber);
      if (!floor) {
        return res.status(404).json({ message: 'Floor not found' });
      }
      res.json({ message: 'Floor updated successfully', floor });
    } catch (error) {
      console.error('Error updating floor:', error);
      if (error.code === '23503') {
        return res.status(400).json({ message: 'Invalid building ID' });
      }
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Floor number already exists in this building' });
      }
      res.status(500).json({ message: 'Server error updating floor' });
    }
  }
);

// DELETE /api/floors/:id (Admin only)
router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid floor ID' });
    }

    try {
      await deleteFloor(id);
      res.json({ message: 'Floor deleted successfully' });
    } catch (error) {
      console.error('Error deleting floor:', error);
      res.status(500).json({ message: 'Server error deleting floor' });
    }
  }
);

module.exports = router;
