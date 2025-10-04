import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="admin-home">
      <section className="admin-hero">
        <div className="hero-overlay">
          <h1 className="hero-title">
            <i className="bi bi-shield-check"></i> Admin Dashboard
          </h1>
          <p className="hero-subtitle">Welcome, {user.name} ({user.role}). Manage the system efficiently.</p>
        </div>
      </section>

      <section className="admin-tools-section">
        <h2 className="section-title">
          <i className="bi bi-tools"></i> Admin Tools
        </h2>
        <div className="role-tools">
          <Link to="/admin/register" className="role-tool-item">
            <i className="bi bi-person-plus role-tool-icon"></i>
            <h5 className="role-tool-title">Register New User</h5>
            <p className="role-tool-desc">Add new users or admins to the system with custom roles and secure passwords.</p>
          </Link>
          <Link to="/admin/approvals" className="role-tool-item">
            <i className="bi bi-check-circle role-tool-icon"></i>
            <h5 className="role-tool-title">Approve/Deny Requests</h5>
            <p className="role-tool-desc">Review and manage pending room booking requests with filters and approval tools.</p>
          </Link>
          <Link to="/admin/buildings" className="role-tool-item">
            <i className="bi bi-building role-tool-icon"></i>
            <h5 className="role-tool-title">Manage Buildings</h5>
            <p className="role-tool-desc">Add, edit, or remove buildings in the system.</p>
          </Link>
          <Link to="/admin/floors" className="role-tool-item">
            <i className="bi bi-layers role-tool-icon"></i>
            <h5 className="role-tool-title">Manage Floors</h5>
            <p className="role-tool-desc">Manage floors within each building.</p>
          </Link>
          <Link to="/admin/rooms" className="role-tool-item">
            <i className="bi bi-door-open role-tool-icon"></i>
            <h5 className="role-tool-title">Manage Rooms</h5>
            <p className="role-tool-desc">Add, edit, or remove individual rooms.</p>
          </Link>
          <Link to="/admin/bookings" className="role-tool-item">
            <i className="bi bi-calendar-check role-tool-icon"></i>
            <h5 className="role-tool-title">View All Bookings</h5>
            <p className="role-tool-desc">View and manage all room bookings across the system.</p>
          </Link>
          <Link to="/admin/users" className="role-tool-item">
            <i className="bi bi-people-fill role-tool-icon"></i>
            <h5 className="role-tool-title">Manage Users</h5>
            <p className="role-tool-desc">View, edit, or remove users in the system.</p>
          </Link>
          <Link to="/change-password" className="role-tool-item">
            <i className="bi bi-key role-tool-icon"></i>
            <h5 className="role-tool-title">Change Password</h5>
            <p className="role-tool-desc">Update your admin password securely.</p>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
