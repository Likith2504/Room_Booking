import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src="https://img.icons8.com/color/48/000000/meeting-room.png" alt="Room Booking Logo" className="navbar-logo" />
          Room Booking System
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {user ? (
              <>
                {user.role === 'user' && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/booking">
                        <i className="bi bi-calendar-plus"></i> Book Room
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/my-bookings">
                        <i className="bi bi-list-check"></i> My Bookings
                      </Link>
                    </li>
                  </>
                )}
                {user.role === 'admin' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin">
                      <i className="bi bi-shield-check"></i> Admin Dashboard
                    </Link>
                  </li>
                )}
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <i className="bi bi-box-arrow-in-right"></i> User Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin-login">
                    <i className="bi bi-shield-check"></i> Admin Login
                  </Link>
                </li>
              </>
            )}
          </ul>
          {user && (
            <ul className="navbar-nav">
              <li className="nav-item">
                <span className="navbar-text me-2">
                  <i className="bi bi-person-circle"></i> {user.name} ({user.role})
                </span>
              </li>
              <li className="nav-item">
                <button className="btn btn-outline-light" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
