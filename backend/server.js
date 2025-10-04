require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database'); // Import to connect DB

const authRouter = require('./routes/auth');
const buildingsRouter = require('./routes/buildings');
const floorsRouter = require('./routes/floors');
const roomsRouter = require('./routes/rooms');
const bookingsRouter = require('./routes/bookings');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test DB connection on startup
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Database connected successfully');
  release();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/buildings', buildingsRouter);
app.use('/api/floors', floorsRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/users', usersRouter);

// Ensure authRouter is registered before usersRouter to catch /api/admin/users/upload-csv route
// The route /api/admin/users/upload-csv is defined in authRouter

// Basic route for health check
app.get('/', (req, res) => {
  res.json({ message: 'Room Booking API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
