import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import UserHome from './components/UserHome';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import UserRegistration from './components/UserRegistration';
import BookingApprovals from './components/BookingApprovals';
import RoomCalendar from './components/RoomCalendar';
import MyBookings from './components/MyBookings';
import ChangePassword from './components/ChangePassword';
import AdminBuildings from './components/AdminBuildings';
import AdminFloors from './components/AdminFloors';
import AdminRooms from './components/AdminRooms';
import AdminUsers from './components/AdminUsers';
import UserCalendar from './components/UserCalendar';
import AdminBookings from './components/AdminBookings';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, userOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/user" replace />;
  }

  if (userOnly && user.role !== 'user') {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

// Role-Based Redirect for Root Route
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/user" replace />;
};

// Layout Component with Navbar
const Layout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

// Main App Component
const AppContent = () => {
  return (
    <Router>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/user"
              element={
                <ProtectedRoute userOnly={true}>
                  <UserHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking"
              element={
                <ProtectedRoute userOnly={true}>
                  <BookingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute userOnly={true}>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute userOnly={true}>
                  <UserCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/register"
              element={
                <ProtectedRoute adminOnly={true}>
                  <UserRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/approvals"
              element={
                <ProtectedRoute adminOnly={true}>
                  <BookingApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/buildings"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminBuildings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/floors"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminFloors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rooms"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminRooms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:id"
              element={
                <ProtectedRoute userOnly={true}>
                  <RoomCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
