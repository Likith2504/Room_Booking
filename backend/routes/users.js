const express = require('express');
const { getAllUsers, updateUser, deleteUser } = require('../models/dbQueries');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// GET /api/users (Admin only)
router.get(
  '/',
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const users = await getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error fetching users' });
    }
  }
);

// PUT /api/users/:id (Admin only)
router.put(
  '/:id',
  verifyToken,
  isAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = parseInt(req.params.id);
    const { name, email } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
      const user = await updateUser(id, name, email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User updated successfully', user });
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ message: 'Email already exists' });
      }
      res.status(500).json({ message: 'Server error updating user' });
    }
  }
);

// DELETE /api/users/:id (Admin only)
router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
      await deleteUser(id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Server error deleting user' });
    }
  }
);

module.exports = router;
