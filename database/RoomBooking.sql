-- Create database if not exists (run this manually in psql: CREATE DATABASE roombooking;)
-- Then run: \c roombooking

-- Enable UUID extension if needed, but using SERIAL for simplicity
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buildings table
CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Floors table
CREATE TABLE IF NOT EXISTS floors (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL
);

-- Add unique constraint to prevent duplicate floor numbers per building
ALTER TABLE IF EXISTS floors ADD CONSTRAINT unique_floor_per_building UNIQUE (building_id, floor_number);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    floor_id INTEGER NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    description TEXT
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_reason TEXT,
    CHECK (start_time < end_time)
);

-- Add admin_reason column if not exists (for existing databases)
ALTER TABLE IF EXISTS bookings ADD COLUMN IF NOT EXISTS admin_reason TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_room_time ON bookings (room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings (user_id);

-- Seed admins
INSERT INTO admins (id, name, email, password) VALUES
(1, 'Admin User', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(3, 'MainAdmin', 'admin@gmail.com', '$2b$10$sOJvm.rAAr2EX3l2tvRIB.dDr/ywqVmKXw225/9yKKziAs/1mA1Me')
ON CONFLICT (id) DO NOTHING;

-- Seed users
INSERT INTO users (id, name, email, password) VALUES 
(1, 'Regular User', 'user@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (id) DO NOTHING;

-- Sample approved booking for testing availability (overlaps 10:00-10:30 on a future date) - Note: This requires rooms to exist, so comment out until rooms are added dynamically
-- INSERT INTO bookings (id, room_id, user_id, start_time, end_time, purpose, status, created_at) VALUES 
-- (1, 3, 1, '2024-10-28 10:00:00', '2024-10-28 10:30:00', 'Team Meeting', 'approved', CURRENT_TIMESTAMP)
-- ON CONFLICT (id) DO NOTHING;

-- Update sequences to prevent duplicate key errors on auto-increment
SELECT setval('admins_id_seq', COALESCE((SELECT MAX(id) FROM admins), 1));
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval('buildings_id_seq', COALESCE((SELECT MAX(id) FROM buildings), 1));
SELECT setval('floors_id_seq', COALESCE((SELECT MAX(id) FROM floors), 1));
SELECT setval('rooms_id_seq', COALESCE((SELECT MAX(id) FROM rooms), 1));
SELECT setval('bookings_id_seq', COALESCE((SELECT MAX(id) FROM bookings), 1));

select * from buildings;
select * from users;
select * from admins;
select * from floors;
select * from rooms;
SELECT setval('buildings_id_seq', (SELECT COALESCE(MAX(id), 1) FROM buildings));
SELECT setval('rooms_id_seq', (SELECT COALESCE(MAX(id), 1) FROM rooms));
SELECT setval('floors_id_seq', (SELECT COALESCE(MAX(id), 1) FROM floors));
