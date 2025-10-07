import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const AdminFloors = () => {
  const [floors, setFloors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [newFloor, setNewFloor] = useState({ floorNumber: '', buildingId: '' });
  const [editingFloor, setEditingFloor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFloors();
    fetchBuildings();
  }, []);

  const fetchFloors = async () => {
    try {
      const response = await api.get('/floors/all');
      setFloors(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch floors');
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await api.get('/buildings');
      setBuildings(response.data);
    } catch (err) {
      setError('Failed to fetch buildings');
    }
  };

  const handleInputChange = (e) => {
    setNewFloor({ ...newFloor, [e.target.name]: e.target.value });
  };

  const handleEdit = (floor) => {
    setEditingFloor(floor);
    setNewFloor({ floorNumber: floor.floor_number, buildingId: floor.building_id });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/floors/${editingFloor.id}`, newFloor);
      setEditingFloor(null);
      setNewFloor({ floorNumber: '', buildingId: '' });
      fetchFloors();
      setError('');
    } catch (err) {
      setError('Failed to update floor');
    }
  };

  const handleCancelEdit = () => {
    setEditingFloor(null);
    setNewFloor({ floorNumber: '', buildingId: '' });
  };

  const handleSubmit = editingFloor ? handleUpdate : async (e) => {
    e.preventDefault();

    // Frontend validation for duplicate floor number in the same building
    const duplicateFloor = floors.find(
      (floor) =>
        floor.floor_number === Number(newFloor.floorNumber) &&
        floor.building_id === Number(newFloor.buildingId)
    );
    if (duplicateFloor) {
      setError('Floor number already exists in this building');
      return;
    }

    try {
      await api.post('/floors', newFloor);
      setNewFloor({ floorNumber: '', buildingId: '' });
      fetchFloors();
      setError('');
    } catch (err) {
      setError('Failed to add floor');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this floor?')) {
      try {
        await api.delete(`/floors/${id}`);
        fetchFloors();
      } catch (err) {
        setError('Failed to delete floor');
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
                <i className="bi bi-layers"></i> Manage Floors
              </h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="mb-4">
                <div className="row">
                  <div className="col-md-4">
                    <input
                      type="number"
                      name="floorNumber"
                      placeholder={editingFloor ? "Edit Floor Number" : "Floor Number (e.g., 1)"}
                      value={newFloor.floorNumber}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                      min="1"
                    />
                  </div>
                  <div className="col-md-5">
                    <select
                      name="buildingId"
                      value={newFloor.buildingId}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Building</option>
                      {buildings.map((building) => (
                        <option key={building.id} value={building.id}>
                          {building.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <button type="submit" className="btn btn-primary w-100">
                      {editingFloor ? 'Update Floor' : 'Add Floor'}
                    </button>
                    {editingFloor && (
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
                      <th>Floor No</th>
                      <th>Building</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {floors.map((floor) => (
                      <tr key={floor.id}>
                        <td>{floor.id}</td>
                        <td>{floor.floor_number}</td>
                        <td>{floor.building_name}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handleEdit(floor)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(floor.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {floors.length === 0 && (
                <p className="text-center text-muted">No floors found. Add one above.</p>
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

export default AdminFloors;
