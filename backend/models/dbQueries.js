const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all buildings
async function getBuildings() {
  const query = 'SELECT * FROM buildings ORDER BY name';
  const result = await pool.query(query);
  return result.rows;
}

// Get floors by building ID
async function getFloors(buildingId) {
  const query = 'SELECT * FROM floors WHERE building_id = $1 ORDER BY floor_number';
  const result = await pool.query(query, [buildingId]);
  return result.rows;
}

// Get all floors with building names
async function getAllFloors() {
  const query = 'SELECT f.*, b.name as building_name FROM floors f JOIN buildings b ON f.building_id = b.id ORDER BY b.name, f.floor_number';
  const result = await pool.query(query);
  return result.rows;
}

// Get rooms by floor ID
async function getRooms(floorId) {
  const query = 'SELECT * FROM rooms WHERE floor_id = $1 ORDER BY name';
  const result = await pool.query(query, [floorId]);
  return result.rows;
}

// Get all rooms with floor and building names
async function getAllRooms() {
  const query = 'SELECT r.*, f.floor_number as floor_name, b.name as building_name FROM rooms r JOIN floors f ON r.floor_id = f.id JOIN buildings b ON f.building_id = b.id ORDER BY b.name, f.floor_number, r.name';
  const result = await pool.query(query);
  return result.rows;
}

// Create a new booking (pending status)
async function createBooking(bookingData) {
  const { room_id, user_id, start_time, end_time, purpose } = bookingData;
  const query = `
    INSERT INTO bookings (room_id, user_id, start_time, end_time, purpose, status)
    VALUES ($1, $2, $3, $4, $5, 'pending')
    RETURNING *
  `;
  const result = await pool.query(query, [room_id, user_id, start_time, end_time, purpose]);
  return result.rows[0];
}

// Get bookings by room ID and optional status
async function getBookingsByRoom(roomId, status = null) {
  let query = 'SELECT * FROM bookings WHERE room_id = $1';
  const params = [roomId];
  if (status) {
    query += ' AND status = $2';
    params.push(status);
  }
  query += ' ORDER BY start_time';
  const result = await pool.query(query, params);
  return result.rows;
}

// Get all bookings for admin dashboard (optionally filtered by status)
async function getAllAdminBookings(statusFilter = null) {
  let query = 'SELECT b.*, u.name as user_name, r.name as room_name, f.floor_number, bu.name as building_name, b.admin_reason ' +
              'FROM bookings b ' +
              'JOIN users u ON b.user_id = u.id ' +
              'JOIN rooms r ON b.room_id = r.id ' +
              'JOIN floors f ON r.floor_id = f.id ' +
              'JOIN buildings bu ON f.building_id = bu.id ';
  
  const params = [];
  if (statusFilter) {
    query += 'WHERE b.status = $1 ';
    params.push(statusFilter);
  }
  query += 'ORDER BY b.created_at DESC';
  
  const result = await pool.query(query, params);
  return result.rows;
}

// Update booking status (approve or reject) with optional reason
async function updateBookingStatus(bookingId, status, reason = null) {
  const query = 'UPDATE bookings SET status = $1, admin_reason = $2 WHERE id = $3 RETURNING *';
  const result = await pool.query(query, [status, reason, bookingId]);
  return result.rows[0];
}

// Check for conflicts: return true if overlapping approved or pending booking exists
async function checkConflict(roomId, startTime, endTime, excludeId = null) {
  let query = `
    SELECT id FROM bookings
    WHERE room_id = $1
    AND status IN ('approved', 'pending')
    AND (start_time < $3 AND end_time > $2)
  `;
  let params = [roomId, startTime, endTime];
  if (excludeId) {
    query += ' AND id != $4';
    params.push(excludeId);
  }
  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

async function createUser(userData) {
  const { name, email, password, role } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);

  let query, params;
  if (role === 'admin') {
    query = `
      INSERT INTO admins (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email
    `;
    params = [name, email, hashedPassword];
  } else {
    query = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email
    `;
    params = [name, email, hashedPassword];
  }

  const result = await pool.query(query, params);
  return { ...result.rows[0], role };
}

// Get user's bookings
async function getUserBookings(userId) {
  const query = `
    SELECT b.*, r.name as room_name, f.floor_number, bu.name as building_name
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN floors f ON r.floor_id = f.id
    JOIN buildings bu ON f.building_id = bu.id
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

// Get user by email for login
async function getUserByEmail(email) {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

// Get admin by email for login
async function getAdminByEmail(email) {
  const query = 'SELECT * FROM admins WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

async function getFloorAvailability(floorId, dateStr) {
  try {
    // Get rooms on the floor
    const roomsResult = await pool.query('SELECT id, name FROM rooms WHERE floor_id = $1 ORDER BY name', [floorId]);
    const rooms = roomsResult.rows;

    // Parse date to get start and end of day
    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const availability = [];

    for (const room of rooms) {
      // Get approved and pending bookings overlapping the day
      const bookingsResult = await pool.query(
        `SELECT start_time, end_time 
         FROM bookings 
         WHERE room_id = $1 
         AND status IN ('approved', 'pending') 
         AND (start_time < $3 AND end_time > $2)
         ORDER BY start_time`,
        [room.id, startOfDay, endOfDay]
      );

      const bookedIntervals = bookingsResult.rows.map(row => ({
        start: row.start_time,
        end: row.end_time
      }));

      availability.push({
        id: room.id,
        name: room.name,
        bookedIntervals
      });
    }

    return availability;
  } catch (error) {
    console.error('Error fetching floor availability:', error);
    throw error;
  }
}

// Get user or admin by email for login (checks both tables)
async function getUserOrAdminByEmail(email) {
  // First check admins table
  let user = await getAdminByEmail(email);
  if (user) {
    return { ...user, role: 'admin' };
  }

  // Then check users table
  user = await getUserByEmail(email);
  if (user) {
    return { ...user, role: 'user' };
  }

  return null;
}

// Update user or admin password
async function updateUserPassword(userId, role, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  let query;
  if (role === 'admin') {
    query = 'UPDATE admins SET password = $1 WHERE id = $2';
  } else {
    query = 'UPDATE users SET password = $1 WHERE id = $2';
  }

  await pool.query(query, [hashedPassword, userId]);
}

// CRUD for buildings
async function createBuilding(name) {
  const query = 'INSERT INTO buildings (name) VALUES ($1) RETURNING *';
  const result = await pool.query(query, [name]);
  return result.rows[0];
}

async function updateBuilding(id, name) {
  const query = 'UPDATE buildings SET name = $1 WHERE id = $2 RETURNING *';
  const result = await pool.query(query, [name, id]);
  return result.rows[0];
}

async function deleteBuilding(id) {
  const query = 'DELETE FROM buildings WHERE id = $1';
  await pool.query(query, [id]);
}

// CRUD for floors
async function createFloor(buildingId, floorNumber) {
  const query = 'INSERT INTO floors (building_id, floor_number) VALUES ($1, $2) RETURNING *';
  const result = await pool.query(query, [buildingId, floorNumber]);
  return result.rows[0];
}

async function updateFloor(id, buildingId, floorNumber) {
  const query = 'UPDATE floors SET building_id = $1, floor_number = $2 WHERE id = $3 RETURNING *';
  const result = await pool.query(query, [buildingId, floorNumber, id]);
  return result.rows[0];
}

async function deleteFloor(id) {
  const query = 'DELETE FROM floors WHERE id = $1';
  await pool.query(query, [id]);
}

// CRUD for rooms
async function createRoom(floorId, name, capacity, description) {
  const query = 'INSERT INTO rooms (floor_id, name, capacity, description) VALUES ($1, $2, $3, $4) RETURNING *';
  const result = await pool.query(query, [floorId, name, capacity, description]);
  return result.rows[0];
}

async function updateRoom(id, floorId, name, capacity, description) {
  const query = 'UPDATE rooms SET floor_id = $1, name = $2, capacity = COALESCE($3, capacity), description = COALESCE($4, description) WHERE id = $5 RETURNING *';
  const result = await pool.query(query, [floorId, name, capacity, description, id]);
  return result.rows[0];
}

async function deleteRoom(id) {
  const query = 'DELETE FROM rooms WHERE id = $1';
  await pool.query(query, [id]);
}

// CRUD for users
async function getAllUsers() {
  // Get users and admins, add role column
  const userQuery = 'SELECT id, name, email, created_at, \'user\' as role FROM users';
  const adminQuery = 'SELECT id, name, email, created_at, \'admin\' as role FROM admins';
  const result = await pool.query(`${userQuery} UNION ALL ${adminQuery} ORDER BY name`);
  return result.rows;
}

async function updateUser(id, name, email) {
  const query = 'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email';
  const result = await pool.query(query, [name, email, id]);
  return result.rows[0];
}

async function deleteUser(id) {
  const query = 'DELETE FROM users WHERE id = $1';
  await pool.query(query, [id]);
}

// Get single room by ID
async function getRoomById(id) {
  const query = 'SELECT * FROM rooms WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

module.exports = {
  getBuildings,
  getFloors,
  getAllFloors,
  getRooms,
  getAllRooms,
  createBooking,
  getBookingsByRoom,
  getAllAdminBookings,
  updateBookingStatus,
  checkConflict,
  getUserByEmail,
  getAdminByEmail,
  getUserOrAdminByEmail,
  createUser,
  getUserBookings,
  updateUserPassword,
  getFloorAvailability,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  createFloor,
  updateFloor,
  deleteFloor,
  createRoom,
  updateRoom,
  deleteRoom,
  getAllUsers,
  updateUser,
  deleteUser,
  getRoomById
};
