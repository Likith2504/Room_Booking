import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Note: Backend endpoint needed: GET /api/bookings/my
        const response = await api.get('/bookings/my');
        setBookings(response.data);
      } catch (err) {
        setError('Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

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

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">{error}</div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge bg-success">Approved</span>;
      case 'rejected':
        return <span className="badge bg-danger">Rejected</span>;
      case 'pending':
        return <span className="badge bg-warning">Pending</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow">
            <div className="card-header bg-info text-white">
              <h2 className="mb-0">
                <i className="bi bi-list-check"></i> My Bookings
              </h2>
              <p className="mb-0">Welcome, {user.name} ({user.role})</p>
            </div>
            <div className="card-body">
              {bookings.length === 0 ? (
                <div className="text-center">
                  <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="mt-3 text-muted">No bookings found.</p>
                </div>
              ) : (
                <div className="row">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="col-md-6 mb-4">
                      <div className="card h-100">
                        <div className="card-body">
                          <h5 className="card-title">
                            <i className="bi bi-chat-text"></i> {booking.purpose}
                          </h5>
                          <p className="card-text">
                            <i className="bi bi-door-open"></i> <strong>Room:</strong> {booking.room_name}<br />
                            <i className="bi bi-building"></i> <strong>Building:</strong> {booking.building_name}, Floor {booking.floor_number}<br />
                            <i className="bi bi-clock"></i> <strong>Time:</strong> {new Date(booking.start_time).toLocaleString()} - {new Date(booking.end_time).toLocaleString()}<br />
                            <strong>Status:</strong> {getStatusBadge(booking.status)}<br />
                            {(booking.status === 'approved' || booking.status === 'rejected') && booking.admin_reason && (
                              <>
                                {booking.status === 'approved' ? (
                                  <>
                                    <i className="bi bi-check-circle text-success"></i> <strong>Admin Note:</strong> {booking.admin_reason}<br />
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-exclamation-triangle text-danger"></i> <strong>Reason for Rejection:</strong> {booking.admin_reason}<br />
                                  </>
                                )}
                              </>
                            )}
                            <i className="bi bi-calendar-plus"></i> <strong>Created:</strong> {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
