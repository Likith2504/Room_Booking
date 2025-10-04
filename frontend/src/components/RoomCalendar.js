import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

const RoomCalendar = () => {
  const { id: roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomName, setRoomName] = useState('');

  const fetchBookings = useCallback(async () => {
    try {
      const response = await api.get(`/bookings?roomId=${roomId}&status=approved`);
      const bookings = response.data;
      const calendarEvents = bookings.map(booking => ({
        id: booking.id,
        title: `${booking.purpose} (${booking.user_name})`,
        start: new Date(booking.start_time),
        end: new Date(booking.end_time),
      }));
      setEvents(calendarEvents);
      // Assuming room name is in the first booking or fetch separately
      if (bookings.length > 0) {
        setRoomName(bookings[0].room_name || 'Room');
      } else {
        // Fetch room details if no bookings
        const roomResponse = await api.get('/rooms'); // Adjust if needed
        const room = roomResponse.data.find(r => r.id === roomId);
        setRoomName(room ? room.name : 'Room');
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch bookings');
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div>Loading calendar...</div>;

  return (
    <div className="room-calendar">
      <header>
        <h1>{roomName} Calendar</h1>
        <p>Welcome, {user.name} ({user.role})</p>
        <button onClick={() => navigate('/booking')}>Back to Booking</button>
        <button onClick={handleLogout}>Logout</button>
      </header>
      {error && <p className="error">{error}</p>}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        views={['month', 'week', 'day']}
        defaultView="month"
      />
    </div>
  );
};

export default RoomCalendar;
