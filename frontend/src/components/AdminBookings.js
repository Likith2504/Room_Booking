import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/bookings');
        setBookings(response.data);
      } catch (err) {
        setError('Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    const fetchBuildings = async () => {
      try {
        const response = await api.get('/buildings');
        setBuildings(response.data);
      } catch (err) {
        console.error('Failed to fetch buildings');
      }
    };

    fetchBookings();
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      const building = buildings.find(b => b.name === selectedBuilding);
      if (building) {
        api.get(`/floors?building_id=${building.id}`)
          .then(res => setFloors(res.data))
          .catch(() => setFloors([]));
      } else {
        setFloors([]);
      }
      setSelectedFloor('');
      setSelectedRoom('');
    } else {
      setFloors([]);
      setSelectedFloor('');
      setSelectedRoom('');
    }
  }, [selectedBuilding, buildings]);

  useEffect(() => {
    if (selectedFloor) {
      api.get(`/rooms?floor_id=${selectedFloor}`)
        .then(res => setRooms(res.data))
        .catch(() => setRooms([]));
      setSelectedRoom('');
    } else if (selectedBuilding) {
      const building = buildings.find(b => b.name === selectedBuilding);
      if (building) {
        api.get(`/rooms?building_id=${building.id}`)
          .then(res => setRooms(res.data))
          .catch(() => setRooms([]));
      } else {
        setRooms([]);
      }
      setSelectedRoom('');
    } else {
      api.get('/rooms')
        .then(res => setRooms(res.data))
        .catch(() => setRooms([]));
      setSelectedRoom('');
    }
  }, [selectedFloor, selectedBuilding, buildings]);

  const filteredBookings = bookings.filter(booking => {
    return (!selectedStatus || booking.status === selectedStatus) &&
           (!selectedBuilding || booking.building_name === selectedBuilding) &&
           (!selectedFloor || booking.floor_number.toString() === selectedFloor) &&
           (!selectedRoom || booking.room_name === selectedRoom);
  });

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container mt-5 text-danger">Error: {error}</div>;
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">All Room Bookings</h2>

      <div className="row mb-3">
        <div className="col-md-3">
          <label className="form-label">Filter by Status</label>
          <select
            className="form-select"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Filter by Building</label>
          <select
            className="form-select"
            value={selectedBuilding}
            onChange={e => setSelectedBuilding(e.target.value)}
          >
            <option value="">All Buildings</option>
            {buildings.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Filter by Floor</label>
          <select
            className="form-select"
            value={selectedFloor}
            onChange={e => setSelectedFloor(e.target.value)}
            disabled={!selectedBuilding}
          >
            <option value="">All Floors</option>
            {floors.map(f => (
              <option key={f.id} value={f.floor_number}>{f.floor_number}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Filter by Room</label>
          <select
            className="form-select"
            value={selectedRoom}
            onChange={e => setSelectedRoom(e.target.value)}
            disabled={!selectedBuilding}
          >
            <option value="">All Rooms</option>
            {rooms.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>User</th>
              <th>Building</th>
              <th>Floor</th>
              <th>Room</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Purpose</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">No bookings found</td>
              </tr>
            ) : (
              filteredBookings.map(booking => (
                <tr key={booking.id}>
                  <td>{booking.user_name}</td>
                  <td>{booking.building_name}</td>
                  <td>{booking.floor_number}</td>
                  <td>{booking.room_name}</td>
                  <td>{new Date(booking.start_time).toLocaleString()}</td>
                  <td>{new Date(booking.end_time).toLocaleString()}</td>
                  <td>{booking.purpose}</td>
                  <td>
                    <span className={`badge ${booking.status === 'approved' ? 'bg-success' : booking.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBookings;
