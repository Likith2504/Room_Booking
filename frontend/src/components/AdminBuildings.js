import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const AdminBuildings = () => {
  const [buildings, setBuildings] = useState([]);
  const [newBuilding, setNewBuilding] = useState({ name: '' });
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const response = await api.get('/buildings');
      setBuildings(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch buildings');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setNewBuilding({ ...newBuilding, [e.target.name]: e.target.value });
  };

  const handleEdit = (building) => {
    setEditingBuilding(building);
    setNewBuilding({ name: building.name });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/buildings/${editingBuilding.id}`, { name: newBuilding.name });
      setEditingBuilding(null);
      setNewBuilding({ name: '' });
      fetchBuildings();
      setError('');
    } catch (err) {
      setError('Failed to update building');
    }
  };

  const handleCancelEdit = () => {
    setEditingBuilding(null);
    setNewBuilding({ name: '' });
  };

  const handleSubmit = editingBuilding ? handleUpdate : async (e) => {
    e.preventDefault();
    try {
      await api.post('/buildings', { name: newBuilding.name });
      setNewBuilding({ name: '' });
      fetchBuildings();
      setError('');
    } catch (err) {
      setError('Failed to add building');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/buildings/${id}`);
      fetchBuildings();
    } catch (err) {
      setError('Failed to delete building');
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
                <i className="bi bi-building"></i> Manage Buildings
              </h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="mb-4">
                <div className="row">
                  <div className="col-md-9">
                    <input
                      type="text"
                      name="name"
                      placeholder={editingBuilding ? "Edit Building Name" : "Building Name"}
                      value={newBuilding.name}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <button type="submit" className="btn btn-primary w-100">
                      {editingBuilding ? 'Update Building' : 'Add Building'}
                    </button>
                    {editingBuilding && (
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map((building) => (
                      <tr key={building.id}>
                        <td>{building.id}</td>
                        <td>{building.name}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-warning me-2"
                            onClick={() => handleEdit(building)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(building.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {buildings.length === 0 && (
                <p className="text-center text-muted">No buildings found. Add one above.</p>
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

export default AdminBuildings;
