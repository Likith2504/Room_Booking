const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { getUserOrAdminByEmail, createUser, updateUserPassword } = require('../models/dbQueries');
const { body, validationResult } = require('express-validator');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Setup multer for file upload
const upload = multer({ dest: 'uploads/' });

const validateUserRow = (row) => {
  const errors = [];
  if (!row.name || row.name.trim() === '') errors.push('Name is required');
  if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Valid email is required');
  if (!row.password || row.password.length < 6) errors.push('Password must be at least 6 characters');
  if (!row.role || !['user', 'admin'].includes(row.role.toLowerCase())) errors.push('Role must be user or admin');
  return errors;
};

// POST /api/admin/users/upload-csv (Admin only)
router.post(
  '/admin/users/upload-csv',
  verifyToken,
  isAdmin,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file is required' });
    }

    const results = [];
    const errors = [];
    const duplicateEmails = [];
    let successCount = 0;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        for (const [index, row] of results.entries()) {
          const rowErrors = validateUserRow(row);
          if (rowErrors.length > 0) {
            errors.push({ row: index + 2, errors: rowErrors }); // +2 for header and 0-based index
            continue;
          }

          // Check for duplicate email
          const existingUser = await getUserOrAdminByEmail(row.email);
          if (existingUser) {
            duplicateEmails.push(row.email);
            continue;
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(row.password, 10);

          try {
            await createUser({
              name: row.name.trim(),
              email: row.email.trim(),
              password: hashedPassword,
              role: row.role.toLowerCase().trim(),
            });
            successCount++;
          } catch (err) {
            errors.push({ row: index + 2, errors: [err.message] });
          }
        }

        // Delete the uploaded file after processing
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded CSV file:', err);
        });

        res.json({
          message: 'CSV import completed',
          successCount,
          duplicateEmails,
          errors,
        });
      })
      .on('error', (err) => {
        fs.unlink(req.file.path, () => {});
        res.status(500).json({ message: 'Error processing CSV file', error: err.message });
      });
  }
);

// POST /api/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Get user or admin by email
      const user = await getUserOrAdminByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Compare password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Sign JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Return token and user info (without password)
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// POST /api/admin/register (Admin only: register new users)
router.post(
  '/admin/register',
  verifyToken,
  isAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      // Check if user or admin already exists
      const existingUser = await getUserOrAdminByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create user
      const newUser = await createUser({ name, email, password, role });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// PUT /api/auth/change-password (Authenticated users: change password)
router.put(
  '/change-password',
  verifyToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    try {
      // Get current password hash
      let query, params;
      if (role === 'admin') {
        query = 'SELECT password FROM admins WHERE id = $1';
        params = [userId];
      } else {
        query = 'SELECT password FROM users WHERE id = $1';
        params = [userId];
      }

      const pool = require('../config/database');
      const result = await pool.query(query, params);
      if (!result.rows[0]) {
        return res.status(404).json({ message: 'User not found' });
      }

      const hashedPassword = result.rows[0].password;

      // Verify current password
      const isValidCurrent = await bcrypt.compare(currentPassword, hashedPassword);
      if (!isValidCurrent) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update password
      await updateUserPassword(userId, role, newPassword);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Server error changing password' });
    }
  }
);

module.exports = router;
