import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BuildingRoomLayout from './BuildingRoomLayout';

const UserHome = () => {
  const { user } = useAuth();

  return (
    <div className="user-home">
      <section className="user-hero">
        <div className="hero-overlay">
          <h1 className="hero-title">
            <i className="bi bi-person-badge"></i> Welcome Back, {user.name}
          </h1>
          <p className="hero-subtitle">Manage your room bookings and schedule efficiently.</p>
          <div className="hero-buttons">
            <Link to="/booking" className="btn btn-success btn-lg">
              <i className="bi bi-calendar-plus"></i> Book a Room
            </Link>
            <Link to="/my-bookings" className="btn btn-outline-light btn-lg">
              <i className="bi bi-list-check"></i> My Bookings
            </Link>
          </div>
        </div>
      </section>

      <section className="user-tools-section">
        <h2 className="section-title">
          <i className="bi bi-star-fill"></i> User Tools
        </h2>
        <div className="role-tools">
          <Link to="/booking" className="role-tool-item">
            <i className="bi bi-calendar-plus role-tool-icon"></i>
            <h5 className="role-tool-title">Book Room</h5>
            <p className="role-tool-desc">Quickly find and reserve available rooms for your meetings.</p>
          </Link>
          <Link to="/my-bookings" className="role-tool-item">
            <i className="bi bi-list-check role-tool-icon"></i>
            <h5 className="role-tool-title">My Bookings</h5>
            <p className="role-tool-desc">View, edit, or cancel your upcoming and past bookings.</p>
          </Link>
          <Link to="/calendar" className="role-tool-item">
            <i className="bi bi-calendar3 role-tool-icon"></i>
            <h5 className="role-tool-title">Calendar</h5>
            <p className="role-tool-desc">View your schedule and available rooms.</p>
          </Link>
          <Link to="/change-password" className="role-tool-item">
            <i className="bi bi-key role-tool-icon"></i>
            <h5 className="role-tool-title">Change Password</h5>
            <p className="role-tool-desc">Update your account password for security.</p>
          </Link>
        </div>
      </section>

      <section className="layout-2d-section mt-4">
        <h2 className="section-title">
          <i className="bi bi-building"></i> Buildings Layout
        </h2>
        <BuildingRoomLayout />
      </section>

      <section className="admin-contact-section">
        <h2 className="section-title">
          <i className="bi bi-person-lines-fill"></i> Admin Contact Details
        </h2>
        <div className="contact-details">
          <div className="contact-item">
            <i className="bi bi-envelope-fill contact-icon"></i>
            <div>
              <h6>Email</h6>
              <a href="mailto:admin@example.com">admin@example.com</a>
            </div>
          </div>
          <div className="contact-item">
            <i className="bi bi-telephone-fill contact-icon"></i>
            <div>
              <h6>Phone</h6>
              <a href="tel:+1234567890">+1 (234) 567-890</a>
            </div>
          </div>
          <div className="contact-item">
            <i className="bi bi-linkedin contact-icon"></i>
            <div>
              <h6>LinkedIn</h6>
              <a href="https://linkedin.com/in/admin" target="_blank" rel="noopener noreferrer">linkedin.com/in/admin</a>
            </div>
          </div>
          <div className="contact-item">
            <i className="bi bi-whatsapp contact-icon"></i>
            <div>
              <h6>WhatsApp</h6>
              <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer">+1 (234) 567-890</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UserHome;
