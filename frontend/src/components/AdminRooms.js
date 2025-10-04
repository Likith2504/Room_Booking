import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [floors, setFloors] = useState([]);
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', floorId: '', description: '' });
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRooms();
    fetchFloors();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms/all');
      setRooms(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch rooms');
      setLoading(false);
    }
  };

  const fetchFloors = async () => {
    try {
      const response = await api.get('/floors/all');
      setFloors(response.data);
    } catch (err) {
      setError('Failed to fetch floors');
    }
  };

  const handleInputChange = (e) => {
    setNewRoom({ ...newRoom, [e.target.name]: e.target.value });
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setNewRoom({ name: room.name, capacity: room.capacity, floorId: room.floor_id, description: room.description });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/rooms/${editingRoom.id}`, newRoom);
      setEditingRoom(null);
      setNewRoom({ name: '', capacity: '', floorId: '', description: '' });
      fetchRooms();
      setError('');
    } catch (err) {
      setError('Failed to update room');
    }
  };

  const handleCancelEdit = () => {
    setEditingRoom(null);
    setNewRoom({ name: '', capacity: '', floorId: '', description: '' });
  };

  const handleSubmit = editingRoom ? handleUpdate : async (e) => {
    e.preventDefault();
    try {
      await api.post('/rooms', newRoom);
      setNewRoom({ name: '', capacity: '', floorId: '', description: '' });
      fetchRooms();
      setError('');
    } catch (err) {
      setError('Failed to add room');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await api.delete(`/rooms/${id}`);
        fetchRooms();
      } catch (err) {
        setError('Failed to delete room');
      }
    }
  };

  if (loading) return <div className="container mt-5">Loading...</div>;

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-12">
          <div className="card shadow mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">
                <i className="bi bi-door-open"></i> Manage Rooms
              </h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="mb-4">
                <div className="row">
                  <div className="col-md-3">
                    <input
                      type="text"
                      name="name"
                      placeholder={editingRoom ? "Edit Room Name" : "Room Name (e.g., Conference Room A)"}
                      value={newRoom.name}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-2">
                    <input
                      type="number"
                      name="capacity"
                      placeholder={editingRoom ? "Edit Capacity" : "Capacity"}
                      value={newRoom.capacity}
                      onChange={handleInputChange}
                      className="form-control"
                      min="1"
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <select
                      name="floorId"
                      value={newRoom.floorId}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Floor</option>
                      {floors.map((floor) => (
                        <option key={floor.id} value={floor.id}>
                          {floor.floor_number} - {floor.building_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="text"
                      name="description"
                      placeholder={editingRoom ? "Edit Description" : "Description (optional)"}
                      value={newRoom.description}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-1">
                    <button type="submit" className="btn btn-primary w-100">
                      {editingRoom ? 'Update Room' : 'Add Room'}
                    </button>
                    {editingRoom && (
                      <button type="button" className="btn btn-secondary w-100 mt-2" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                {error && <div className="alert alert-danger mt-2">{error}</div>}
              </form>

              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Capacity</th>
                      <th>Floor</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room.id}>
                        <td>{room.id}</td>
                        <td>{room.name}</td>
                        <td>{room.capacity}</td>
                        <td>{room.floor_name} - {room.building_name}</td>
                        <td>{room.description || 'N/A'}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handleEdit(room)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(room.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rooms.length === 0 && (
                <p className="text-center text-muted">No rooms found. Add one above.</p>
              )}
            </div>
          </div>
          <Link to="/admin" className="btn btn-secondary">
            <i className="bi bi-arrow-left"></i> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminRooms;
