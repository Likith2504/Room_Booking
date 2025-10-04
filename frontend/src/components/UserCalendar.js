import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Calendar from 'react-calendar';
import { isSameDay, format } from 'date-fns';
import 'react-calendar/dist/Calendar.css';

const UserCalendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/bookings/my');
        setBookings(response.data);
      } catch (err) {
        console.error('Failed to fetch bookings for calendar');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  // Get dates with bookings
  const datesWithBookings = bookings.map(booking => new Date(booking.start_time)).filter((date, index, self) => 
    index === self.findIndex(d => isSameDay(d, date))
  );

  // Check if date has booking
  const hasBooking = (date) => datesWithBookings.some(bDate => isSameDay(bDate, date));

  // Tile content for calendar (green dot)
  const tileContent = ({ date, view }) => {
    if (view === 'month' && hasBooking(date)) {
      return (
        <div style={{ position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            bottom: 4, 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: 12, 
            height: 12, 
            backgroundColor: '#28a745', 
            borderRadius: '50%', 
            border: '2px solid #fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}></div>
        </div>
      );
    }
    return null;
  };

  // Handle date click - navigate to MyBookings
  const handleDateClick = (value) => {
    navigate('/my-bookings');
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="text-center">
              <div className="spinner-border text-info" style={{ width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 h5 text-info">Loading your calendar...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="display-5 fw-bold text-primary mb-1">
                  <i className="bi bi-calendar3-week me-3"></i>Meeting Calendar
                </h1>
                <p className="text-muted mb-0">Welcome back, {user.name}! Here's your schedule overview.</p>
              </div>
              <div className="text-end">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <small className="text-muted d-block">Total Bookings</small>
                    <h3 className="mb-0 text-primary">{bookings.length}</h3>
                  </div>
                  <Link to="/booking" className="btn btn-primary btn-lg">
                    <i className="bi bi-plus-circle me-2"></i>Book Room
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Main Calendar Section */}
          <div className="col-lg-8 mb-4">
            <div className="card shadow-sm border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="card-header bg-white border-0 py-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0 text-dark">
                    <i className="bi bi-calendar-range me-2 text-primary"></i>
                    {format(new Date(), 'MMMM yyyy')}
                  </h3>
                  <div className="legend d-flex align-items-center">
                    <div className="d-flex align-items-center me-3">
                      <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#28a745',
                        borderRadius: '50%',
                        border: '2px solid #fff',
                        marginRight: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></div>
                      <small className="text-muted fw-medium">Meeting Day</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div className="calendar-wrapper d-flex justify-content-center">
                  <Calendar
                    onClickDay={handleDateClick}
                    tileContent={tileContent}
                    prevLabel={<i className="bi bi-chevron-left"></i>}
                    nextLabel={<i className="bi bi-chevron-right"></i>}
                    className="modern-calendar"
                  />
                </div>
                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    <small>Click on any date to view your booking details in My Bookings.</small>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="col-lg-4">
            {/* Upcoming Bookings */}
            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '20px' }}>
              <div className="card-header bg-light border-0 py-3">
                <h5 className="mb-0 text-dark">
                  <i className="bi bi-clock-history me-2 text-warning"></i>
                  Upcoming Meetings
                </h5>
              </div>
              <div className="card-body">
                {bookings.length > 0 ? (
                  <div className="upcoming-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {bookings
                      .filter(booking => new Date(booking.start_time) >= new Date())
                      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                      .slice(0, 5)
                      .map((booking, index) => (
                        <div key={index} className="upcoming-item p-3 mb-2 bg-light rounded" style={{ borderLeft: '4px solid #007bff' }}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1 text-dark">{booking.purpose}</h6>
                              <p className="mb-0 small text-primary fw-medium">
                                <i className="bi bi-calendar-event me-1"></i>
                                {format(new Date(booking.start_time), 'MMM dd, yyyy')}
                              </p>
                              <p className="mb-0 small text-primary">
                                <i className="bi bi-clock me-1"></i>
                                {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
                              </p>
                              <small className="text-muted d-block mt-1">
                                Status: <span className={`badge bg-${booking.status === 'approved' ? 'success' : booking.status === 'rejected' ? 'danger' : 'warning'}`}>
                                  {booking.status}
                                </span>
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3 text-muted">No upcoming meetings</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card shadow-sm border-0" style={{ borderRadius: '20px' }}>
              <div className="card-header bg-light border-0 py-3">
                <h5 className="mb-0 text-dark">
                  <i className="bi bi-gear me-2 text-info"></i>
                  Quick Actions
                </h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <Link to="/booking" className="btn btn-outline-primary">
                    <i className="bi bi-calendar-plus me-2"></i>Book New Room
                  </Link>
                  <Link to="/my-bookings" className="btn btn-outline-secondary">
                    <i className="bi bi-list-check me-2"></i>View All Bookings
                  </Link>
                  <Link to="/" className="btn btn-outline-success">
                    <i className="bi bi-house me-2"></i>Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State Overlay */}
        {bookings.length === 0 && (
          <div className="row justify-content-center mt-4">
            <div className="col-md-6">
              <div className="card shadow-sm border-0 text-center" style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.9)' }}>
                <div className="card-body py-5">
                  <i className="bi bi-calendar-heart text-muted" style={{ fontSize: '4rem', opacity: 0.6 }}></i>
                  <h4 className="mt-3 text-muted">Your calendar is empty</h4>
                  <p className="text-muted mb-4">Start by booking your first meeting room!</p>
                  <Link to="/booking" className="btn btn-primary btn-lg">
                    <i className="bi bi-plus-circle me-2"></i>Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .calendar-page {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .modern-calendar {
          border: none !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1) !important;
          border-radius: 16px !important;
          width: 100% !important;
          max-width: 500px;
        }
        .modern-calendar .react-calendar__navigation {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: none;
          border-radius: 16px 16px 0 0 !important;
          padding: 2rem 1.5rem !important;
          margin-bottom: 0;
        }
        .modern-calendar .react-calendar__navigation button {
          background: rgba(255,255,255,0.2) !important;
          border: none !important;
          color: white !important;
          font-size: 1.2rem !important;
          padding: 0.5rem !important;
          border-radius: 50% !important;
          transition: all 0.3s ease;
          width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .modern-calendar .react-calendar__navigation button:hover {
          background: rgba(255,255,255,0.3) !important;
          transform: scale(1.1);
        }
        .modern-calendar .react-calendar_navigation_label {
          font-weight: bold !important;
          color: white !important;
          font-size: 1.3rem !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .modern-calendar .react-calendar_month-view_weekdays {
          background: #f8f9fa;
          border-bottom: 2px solid #e9ecef;
        }
        .modern-calendar .react-calendar_month-viewweekdays_weekday {
          font-weight: 600 !important;
          color: #6c757d !important;
          text-transform: uppercase !important;
          font-size: 0.8rem !important;
          padding: 1rem 0.5rem !important;
        }
        .modern-calendar .react-calendar__tile {
          border-radius: 12px !important;
          padding: 1rem 0.5rem !important;
          margin: 0.3rem !important;
          transition: all 0.3s ease !important;
          border: 2px solid transparent !important;
          height: 60px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 500 !important;
          color: #495057 !important;
          position: relative;
        }
        .modern-calendar .react-calendar__tile:hover {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
          border-color: #2196f3 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        .modern-calendar .react-calendar__tile--active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          border-color: #5a67d8 !important;
          box-shadow: 0 4px 12px rgba(102,126,234,0.3) !important;
        }
        .modern-calendar .react-calendar__tile--hasActive {
          background: #e3f2fd !important;
          color: #1976d2 !important;
        }
        .upcoming-item {
          transition: all 0.2s ease;
        }
        .upcoming-item:hover {
          transform: translateX(5px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .legend {
          background: #f8f9fa;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 1px solid #dee2e6;
        }
      `}</style>
    </div>
  );
};

export default UserCalendar;

