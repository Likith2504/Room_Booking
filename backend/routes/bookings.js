const express = require('express');
const pool = require('../config/database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
  createBooking,
  getBookingsByRoom,
  getAllAdminBookings,
  updateBookingStatus,
  checkConflict,
  getUserBookings,
  getFloorAvailability
} = require('../models/dbQueries');
const { body, validationResult, query } = require('express-validator');

const router = express.Router();

// POST /api/bookings - Create booking request (user only)
router.post(
  '/',
  verifyToken,
  [
    body('room_id').isInt({ min: 1 }).withMessage('Valid room ID required'),
    body('start_time').isISO8601().toDate().withMessage('Valid start time required'),
    body('end_time').isISO8601().toDate().withMessage('Valid end time required'),
    body('purpose').notEmpty().trim().escape().withMessage('Purpose is required'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Ensure start_time < end_time
    const { start_time, end_time } = req.body;
    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ message: 'Start time must be before end time' });
    }

    const bookingData = {
      ...req.body,
      user_id: req.user.id,
    };

    try {
      // Verify user exists
      const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
      if (!userResult.rows[0]) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check for conflicts with approved bookings before creating pending booking
      const hasConflict = await checkConflict(bookingData.room_id, start_time, end_time);
      if (hasConflict) {
        return res.status(409).json({ message: 'Room is already booked for this time slot. Please choose a different time.' });
      }

      const newBooking = await createBooking(bookingData);
      res.status(201).json({ message: 'Booking request submitted successfully', booking: newBooking });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ message: 'Server error creating booking' });
    }
  }
);

// GET /api/bookings - Get bookings by roomId or all for admin (optionally filtered by status)
router.get(
  '/',
  verifyToken,
  [query('roomId').optional().isInt({ min: 1 }), query('status').optional().isIn(['pending', 'approved', 'rejected'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { roomId, status } = req.query;

    try {
      let bookings;
      if (roomId) {
        // Get bookings for a specific room (filter by status if provided)
        bookings = await getBookingsByRoom(roomId, status);
      } else if (req.user.role === 'admin') {
        // Get all bookings for admin dashboard (optionally filtered by status)
        bookings = await getAllAdminBookings(status || null);
      } else {
        return res.status(400).json({ message: 'Admin access required for fetching all bookings' });
      }
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ message: 'Server error fetching bookings' });
    }
  }
);

// GET /api/bookings/my - Get user's own bookings
router.get(
  '/my',
  verifyToken,
  async (req, res) => {
    try {
      const bookings = await getUserBookings(req.user.id);
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ message: 'Server error fetching user bookings' });
    }
  }
);

// PUT /api/bookings/:id/approve - Approve booking (admin only)
router.put(
  '/:id/approve',
  verifyToken,
  isAdmin,
  [
    body('reason').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { reason } = req.body;

    try {
      // Fetch the specific booking
      const bookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
      const booking = bookingResult.rows[0];
      if (!booking || booking.status !== 'pending') {
        return res.status(404).json({ message: 'Pending booking not found' });
      }

      // Check for conflicts (exclude current booking)
      const hasConflict = await checkConflict(booking.room_id, booking.start_time, booking.end_time, id);
      if (hasConflict) {
        return res.status(409).json({ message: 'Cannot approve: Room is already booked for this time slot' });
      }

      const updatedBooking = await updateBookingStatus(id, 'approved', reason);
      res.json({ message: 'Booking approved successfully', booking: updatedBooking });
    } catch (error) {
      console.error('Error approving booking:', error);
      res.status(500).json({ message: 'Server error approving booking' });
    }
  }
);

// PUT /api/bookings/:id/reject - Reject booking (admin only)
router.put(
  '/:id/reject',
  verifyToken,
  isAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Reason is required for rejection' });
    }

    try {
      const updatedBooking = await updateBookingStatus(id, 'rejected', reason);
      if (!updatedBooking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      res.json({ message: 'Booking rejected successfully', booking: updatedBooking });
    } catch (error) {
      console.error('Error rejecting booking:', error);
      res.status(500).json({ message: 'Server error rejecting booking' });
    }
  }
);

// GET /api/bookings/availability - Get availability for floor on specific date (user only)
router.get(
  '/availability',
  verifyToken,
  [
    query('floorId').isInt({ min: 1 }).withMessage('Valid floor ID required'),
    query('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Valid date (YYYY-MM-DD) required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { floorId, date } = req.query;

    try {
      const availability = await getFloorAvailability(floorId, date);
      res.json({ rooms: availability });
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({ message: 'Server error fetching availability' });
    }
  }
);

// GET /api/bookings/availability/all - Get booking status for all rooms for a given date and time
router.get(
  '/availability/all',
  async (req, res) => {
    const { date, time } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Valid date (YYYY-MM-DD) required' });
    }
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ message: 'Valid time (HH:mm) required' });
    }
    try {
      // Get all rooms
      const roomsResult = await pool.query('SELECT id, name FROM rooms');
      const rooms = roomsResult.rows;

      // Calculate slot start and end (15 min slot)
      const slotStart = new Date(`${date}T${time}:00`);
      const slotEnd = new Date(slotStart.getTime() + 15 * 60 * 1000);

      // Get all bookings overlapping the slot
      const bookingsResult = await pool.query(
        `SELECT room_id, status, start_time, end_time FROM bookings WHERE status IN ('approved', 'pending') AND (start_time < $2 AND end_time > $1)`,
        [slotStart, slotEnd]
      );
      const bookings = bookingsResult.rows;

      // Return all bookings for the slot
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching all bookings availability:', error);
      res.status(500).json({ message: 'Server error fetching all bookings availability' });
    }
  }
);

module.exports = router;
