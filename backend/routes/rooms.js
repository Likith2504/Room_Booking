const express = require('express');
const pool = require('../config/database');
const { getRooms, getAllRooms, createRoom, updateRoom, deleteRoom, getRoomById } = require('../models/dbQueries');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /api/rooms?floorId=:id
router.get('/', async (req, res) => {
  const { floorId } = req.query;
  if (!floorId) {
    return res.status(400).json({ message: 'floorId query parameter is required' });
  }

  try {
    const rooms = await getRooms(floorId);
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

// GET /api/rooms/all (Admin only)
router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const rooms = await getAllRooms();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching all rooms:', error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

// POST /api/rooms (Admin only)
router.post(
  '/',
  verifyToken,
  isAdmin,
  [
    body('floorId').isInt().withMessage('Valid floor ID required'),
    body('name').trim().notEmpty().withMessage('Room name is required').isLength({ max: 100 }).withMessage('Name too long'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { floorId, name, capacity, description } = req.body;

    try {
      const room = await createRoom(floorId, name, capacity, description);

      // Reset sequence to max id + 1 after insert
      await pool.query(`SELECT setval('rooms_id_seq', (SELECT MAX(id) FROM rooms) + 1)`);

      res.status(201).json({ message: 'Room created successfully', room });
    } catch (error) {
      console.error('Error creating room:', error);
      if (error.code === '23503') { // Foreign key violation
        return res.status(400).json({ message: 'Invalid floor ID' });
      }
      res.status(500).json({ message: 'Server error creating room' });
    }
  }
);

// PUT /api/rooms/:id (Admin only)
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  [
    body('floorId').optional({ checkFalsy: true }).isInt().withMessage('Valid floor ID required'),
    body('name').optional({ checkFalsy: true }).trim().notEmpty().withMessage('Room name is required').isLength({ max: 100 }).withMessage('Name too long'),
    body('capacity').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('description').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Description too long')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    try {
      // Fetch existing room
      const existingRoom = await getRoomById(id);
      if (!existingRoom) {
        return res.status(404).json({ message: 'Room not found' });
      }

      // Clean empty strings from req.body to treat as "not provided"
      const cleanBody = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (value !== '' && value !== undefined && value !== null) {
          cleanBody[key] = value;
        }
      }

      const updates = { 
        floorId: cleanBody.floorId, 
        name: cleanBody.name, 
        capacity: cleanBody.capacity, 
        description: cleanBody.description 
      };

      // Merge updates, keeping existing values if not provided or empty
      const floorId = updates.floorId !== undefined ? parseInt(updates.floorId) : existingRoom.floor_id;
      const name = updates.name !== undefined ? updates.name.trim() : existingRoom.name;
      const capacity = updates.capacity !== undefined ? parseInt(updates.capacity) : existingRoom.capacity;
      const description = updates.description !== undefined ? (updates.description.trim() || null) : existingRoom.description;

      const room = await updateRoom(id, floorId, name, capacity, description);
      res.json({ message: 'Room updated successfully', room });
    } catch (error) {
      console.error('Error updating room:', error);
      if (error.code === '23503') {
        return res.status(400).json({ message: 'Invalid floor ID' });
      }
      res.status(500).json({ message: 'Server error updating room' });
    }
  }
);

// DELETE /api/rooms/:id (Admin only)
router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    try {
      await deleteRoom(id);
      res.json({ message: 'Room deleted successfully' });
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ message: 'Server error deleting room' });
    }
  }
);

module.exports = router;
