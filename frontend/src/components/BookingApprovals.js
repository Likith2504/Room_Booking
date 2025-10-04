import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const BookingApprovals = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState({});
  const [modal, setModal] = useState({ show: false, type: '', booking: null });
  const [reason, setReason] = useState('');

  const fetchFloors = useCallback(async (buildingName) => {
    try {
      const building = buildings.find(b => b.name === buildingName);
      if (!building) return;

      const response = await api.get(`/floors?building_id=${building.id}`);
      setFloors(response.data);
    } catch (err) {
      console.error('Failed to fetch floors');
    }
  }, [buildings]);

  const fetchRoomsByBuilding = useCallback(async (buildingName) => {
    try {
      const building = buildings.find(b => b.name === buildingName);
      if (!building) return;

      const response = await api.get(`/rooms?building_id=${building.id}`);
      setRooms(response.data);
    } catch (err) {
      console.error('Failed to fetch rooms for building');
    }
  }, [buildings]);

  const fetchBuildings = async () => {
    try {
      const response = await api.get('/buildings');
      setBuildings(response.data);
    } catch (err) {
      console.error('Failed to fetch buildings');
    }
  };

  const fetchRoomsByFloor = useCallback(async (floorId) => {
    try {
      const response = await api.get(`/rooms?floor_id=${floorId}`);
      setRooms(response.data);
    } catch (err) {
      console.error('Failed to fetch rooms');
    }
  }, []);

  const fetchAllRooms = useCallback(async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data);
    } catch (err) {
      console.error('Failed to fetch rooms');
    }
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      // Filter to only pending bookings for approval page
      const pendingBookings = response.data.filter(booking => booking.status === 'pending');
      setBookings(pendingBookings);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch bookings');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      fetchFloors(selectedBuilding);
      setSelectedFloor('');
      setSelectedRoom('');
    } else {
      setFloors([]);
      setSelectedFloor('');
      setSelectedRoom('');
    }
  }, [selectedBuilding, fetchFloors]);

  useEffect(() => {
    if (selectedFloor) {
      fetchRoomsByFloor(selectedFloor);
    } else if (selectedBuilding) {
      fetchRoomsByBuilding(selectedBuilding);
    } else {
      fetchAllRooms();
    }
  }, [selectedFloor, selectedBuilding, fetchRoomsByFloor, fetchRoomsByBuilding, fetchAllRooms]);

  const openModal = (type, booking) => {
    setModal({ show: true, type, booking });
    setReason('');
  };

  const closeModal = () => {
    setModal({ show: false, type: '', booking: null });
    setReason('');
  };

  const handleSubmitAction = async () => {
    const { type, booking } = modal;
    const endpoint = type === 'approve' ? `/bookings/${booking.id}/approve` : `/bookings/${booking.id}/reject`;
    const data = type === 'reject' ? { reason } : (reason ? { reason } : {});

    setUpdating(prev => ({ ...prev, [booking.id]: type }));
    try {
      const response = await api.put(endpoint, data);
      const updatedBooking = response.data.booking;
      setBookings(prev => prev.map(b => b.id === booking.id ? updatedBooking : b));
      setSuccess(`Booking ${type}d successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      setError('');
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${type} booking`);
    } finally {
      setUpdating(prev => ({ ...prev, [booking.id]: false }));
    }
  };

  const filteredBookings = bookings.filter(booking => {
    return (!selectedBuilding || booking.building_name === selectedBuilding) &&
           (!selectedFloor || booking.floor_number.toString() === selectedFloor) &&
           (!selectedRoom || booking.room_name === selectedRoom) &&
           (!selectedStatus || booking.status === selectedStatus);
  });

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading bookings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-12">
          <div className="card shadow">
            <div className="card-header bg-info text-white">
              <h2 className="mb-0">
                <i className="bi bi-check-circle"></i> Manage All Booking Requests
              </h2>
              <p className="mb-0">Welcome, {user.name} ({user.role})</p>
            </div>
            <div className="card-body">
              {success && <div className="alert alert-success" role="alert">{success}</div>}
              {error && <div className="alert alert-danger" role="alert">{error}</div>}

              <div className="mb-3 text-end">
                <button
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/admin/bookings'}
                >
                  View All Bookings
                </button>
              </div>
              
              {/* Filters */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label">Filter by Building</label>
                  <select
                    className="form-select"
                    value={selectedBuilding}
                    onChange={(e) => setSelectedBuilding(e.target.value)}
                  >
                    <option value="">All Buildings</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Filter by Floor</label>
                  <select
                    className="form-select"
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(e.target.value)}
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
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    disabled={!selectedBuilding}
                  >
                    <option value="">All Rooms</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button className="btn btn-outline-secondary" onClick={() => {
                    setSelectedBuilding('');
                    setSelectedFloor('');
                    setSelectedRoom('');
                    setSelectedStatus('');
                    fetchAllRooms();
                  }}>
                    Clear Filters
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>User Name</th>
                      <th>Building</th>
                      <th>Floor</th>
                      <th>Room</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Purpose</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center">No bookings matching filters</td>
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
                          <td>
                            {booking.status === 'pending' && (
                              <>
                                <button 
                                  className="btn btn-success btn-sm me-2"
                                  onClick={() => openModal('approve', booking)}
                                  disabled={updating[booking.id]}
                                >
                                  {updating[booking.id] === 'approve' ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                      Approving...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-check-circle"></i> Approve
                                    </>
                                  )}
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm"
                                  onClick={() => openModal('reject', booking)}
                                  disabled={updating[booking.id]}
                                >
                                  {updating[booking.id] === 'reject' ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                      Rejecting...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-x-circle"></i> Reject
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                            {booking.status !== 'pending' && (
                              <span className="text-muted">No actions available</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Approve/Reject */}
      {modal.show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modal.type === 'approve' ? 'Approve Booking' : 'Reject Booking'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to <strong>{modal.type}</strong> the booking for{' '}
                  <strong>{modal.booking?.room_name}</strong> by <strong>{modal.booking?.user_name}</strong>?
                </p>
                <div className="mb-3">
                  <label htmlFor="reason" className="form-label">
                    Reason {modal.type === 'reject' ? '(Required)' : '(Optional)'}
                  </label>
                  <textarea
                    className="form-control"
                    id="reason"
                    rows="3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={modal.type === 'reject' ? 'Enter reason for rejection...' : 'Enter optional reason...'}
                    required={modal.type === 'reject'}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${modal.type === 'approve' ? 'btn-success' : 'btn-danger'}`}
                  onClick={handleSubmitAction}
                  disabled={modal.type === 'reject' && !reason.trim()}
                >
                  {modal.type === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingApprovals;
