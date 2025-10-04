import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="guest-home">
      <section className="guest-hero">
        <div className="hero-overlay">
          <h1 className="hero-title">
              Room Booking System
          </h1>
          <p className="hero-subtitle">Efficiently manage meeting and conference room bookings with our user-friendly platform.</p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary btn-lg">
              <i className="bi bi-box-arrow-in-right"></i> User Login
            </Link>
            <Link to="/admin-login" className="btn btn-primary btn-lg">
              <i className="bi bi-shield-check"></i> Admin Login
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">
          <i className="bi bi-star-fill"></i> Key Features
        </h2>
        <div className="role-tools">
          <div className="role-tool-item">
            <i className="bi bi-geo-alt role-tool-icon"></i>
            <h5 className="role-tool-title">Hierarchical Navigation</h5>
            <p className="role-tool-desc">Browse buildings, floors, and rooms with smooth cascading dropdowns for effortless selection.</p>
          </div>
          <div className="role-tool-item">
            <i className="bi bi-check2-circle role-tool-icon"></i>
            <h5 className="role-tool-title">Secure Approval</h5>
            <p className="role-tool-desc">Bookings go through admin review to avoid conflicts and ensure optimal scheduling.</p>
          </div>
          <div className="role-tool-item">
            <i className="bi bi-calendar-range role-tool-icon"></i>
            <h5 className="role-tool-title">Interactive Calendar</h5>
            <p className="role-tool-desc">Visualize availability and approved bookings on a dynamic calendar interface.</p>
          </div>
          <div className="role-tool-item">
            <i className="bi bi-people role-tool-icon"></i>
            <h5 className="role-tool-title">Role-Based Access</h5>
            <p className="role-tool-desc">Users book rooms while admins manage approvals and oversee the entire system.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
