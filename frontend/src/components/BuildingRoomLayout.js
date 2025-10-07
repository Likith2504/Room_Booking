import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const BuildingRoomLayout = () => {
  // Selected IDs only to simplify state
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // Modal visibility
  const [showModal, setShowModal] = useState(false);

  // Date and time selection
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');

  // Static data for buildings, floors, rooms
  const [staticData, setStaticData] = useState([]);
  const [loadingStaticData, setLoadingStaticData] = useState(true);

  // Bookings data and loading/error states
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const navigate = useNavigate();

  // Fetch buildings, floors, rooms on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingStaticData(true);
      try {
        const buildingsRes = await api.get('/buildings');
        const data = [];
        for (const b of buildingsRes.data) {
          const floorsRes = await api.get(`/floors?buildingId=${b.id}`);
          const floorsData = [];
          for (const f of floorsRes.data) {
            const roomsRes = await api.get(`/rooms?floorId=${f.id}`);
            const floorName = f.floor_number === 0 ? 'Ground Floor' : `${f.floor_number}${getSuffix(f.floor_number)} Floor`;
            floorsData.push({ floor: floorName, floorId: f.id, rooms: roomsRes.data.map(r => ({ name: r.name, id: r.id })) });
          }
          data.push({ building: b.name, buildingId: b.id, floors: floorsData });
        }
        setStaticData(data);
      } catch (err) {
        console.error('Error fetching building data:', err);
      } finally {
        setLoadingStaticData(false);
      }
    };
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedDate && selectedTime) {
      fetchBookings(selectedDate, selectedTime);
    }
  }, [selectedDate, selectedTime]);



  const getSuffix = (num) => {
    if (num === 1) return 'st';
    if (num === 2) return 'nd';
    if (num === 3) return 'rd';
    return 'th';
  };

  const fetchBookings = async (date, time) => {
    setLoadingBookings(true);
    setBookingError(null);
    try {
      const res = await api.get(`/bookings/availability/all?date=${date}&time=${time}`);
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookingError('Failed to load booking data. Please try again later.');
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Derive selected building, floor, room names from staticData and selected IDs
  const selectedBuilding = staticData.find(b => b.buildingId === selectedBuildingId);
  const selectedFloor = selectedBuilding?.floors.find(f => f.floorId === selectedFloorId);
  const selectedRoom = selectedFloor?.rooms.find(r => r.id === selectedRoomId);

  // Handlers with useCallback to optimize rendering
  const handleBuildingClick = useCallback((buildingId) => {
    setSelectedBuildingId(buildingId);
    setSelectedFloorId(null);
    setSelectedRoomId(null);
  }, []);

  const handleFloorClick = useCallback((floorId) => {
    setSelectedFloorId(floorId);
    setSelectedRoomId(null);
  }, []);

  const handleRoomClick = useCallback((roomId) => {
    setSelectedRoomId(roomId);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleBookClick = useCallback(() => {
    setShowModal(false);
    if (selectedBuildingId && selectedFloorId && selectedRoomId) {
      navigate('/booking', {
        state: {
          buildingId: selectedBuildingId,
          floorId: selectedFloorId,
          roomId: selectedRoomId,
          selectedDate,
          selectedTime
        }
      });
    }
  }, [navigate, selectedBuildingId, selectedFloorId, selectedRoomId, selectedDate, selectedTime]);

  if (loadingStaticData) return <div>Loading building layout...</div>;

  // Helper to check room availability based on selected date and time
  const isRoomAvailable = (room) => {
    const now = new Date();
    const selectedSlotStart = new Date(`${selectedDate}T${selectedTime}:00`);
    if (selectedSlotStart < now) {
      return false;
    }
    if (!bookings || bookings.length === 0) return true;
    // Check if room is booked in the selected date and time slot with approved status
    const slotStart = new Date(`${selectedDate}T${selectedTime}:00`);
    const slotEnd = new Date(slotStart.getTime() + 15 * 60 * 1000); // 15 minutes slot
    for (const booking of bookings) {
      if (booking.room_id === room.id && booking.status === 'approved') {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        // Check if booking overlaps with selected slot
        if (bookingStart < slotEnd && bookingEnd > slotStart) {
          return false;
        }
      }
    }
    return true;
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center' }}>
        <label>
          Select Date:{' '}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </label>
        <label>
          Select Time:{' '}
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '1rem' }}
          >
            {(() => {
              const slots = [];
              let start = 9 * 60; // 9:00 AM in minutes
              let end = 18 * 60; // 6:00 PM in minutes
              for (let mins = start; mins <= end; mins += 15) {
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                const hour12 = h % 12 === 0 ? 12 : h % 12;
                const ampm = h < 12 ? 'AM' : 'PM';
                const label = `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
                const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                slots.push(<option key={value} value={value}>{label}</option>);
              }
              return slots;
            })()}
          </select>
        </label>
      </div>

      {bookingError && (
        <div style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>
          {bookingError}
        </div>
      )}

      {loadingBookings && (
        <div style={{ marginBottom: 10, textAlign: 'center' }}>
          Loading bookings...
        </div>
      )}
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {staticData.map(b => (
          <div key={b.building} style={{
            backgroundColor: 'white',
            borderRadius: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: 25,
            width: 360,
            minHeight: 320,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            flexGrow: 1,
            maxWidth: 'calc(50% - 40px)'
          }}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: '600', fontSize: '1.3rem' }}>
              <span><span role="img" aria-label="building">🏢</span> {b.building}</span>
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>{selectedDate} {selectedTime}</span>
            </h3>
            {b.floors.map(f => (
              <div key={f.floor} style={{
                backgroundColor: '#f9fbff',
                borderRadius: 10,
                padding: 15,
                boxShadow: 'inset 0 0 8px rgba(0,0,0,0.07)'
              }}>
                <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, fontWeight: '500', fontSize: '1.1rem' }}>
                  <span role="img" aria-label="floor">📄</span> {f.floor}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {f.rooms.map(r => {
                    const isSelected = selectedRoomId === r.id && selectedFloorId === f.floorId && selectedBuildingId === b.buildingId;
                    const available = isRoomAvailable(r);
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          handleBuildingClick(b.buildingId);
                          handleFloorClick(f.floorId);
                          handleRoomClick(r.id);
                        }}
                        disabled={!available}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 8,
                          border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db',
                          backgroundColor: isSelected ? '#3b82f6' : available ? 'white' : '#f3f4f6',
                          color: isSelected ? 'white' : available ? '#374151' : '#9ca3af',
                          cursor: available ? 'pointer' : 'not-allowed',
                          boxShadow: isSelected ? '0 0 10px rgba(59,130,246,0.7)' : 'none',
                          flex: '1 0 30%',
                          minWidth: 110,
                          textAlign: 'center',
                          userSelect: 'none',
                          fontWeight: '500',
                          fontSize: '0.9rem'
                        }}
                      >
                        <div>{r.name}</div>
                        <div style={{ fontSize: 13, color: available ? '#10b981' : '#ef4444', marginTop: 4 }}>
                          {available ? 'Available' : 'Not Available'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {selectedRoom && selectedBuildingId === b.buildingId && (
              <div style={{
                marginTop: 'auto',
                padding: 15,
                backgroundColor: '#dbeafe',
                borderRadius: 10,
                textAlign: 'center',
                fontWeight: '600',
                color: '#1e40af',
                fontSize: '1rem',
                boxShadow: '0 0 8px rgba(59,130,246,0.4)'
              }}>
                Room Selected: {selectedRoom.name}
                <div style={{ fontWeight: 'normal', fontSize: 15, marginTop: 6 }}>
                  You&apos;ve selected {selectedRoom.name} on {selectedFloor.floor} in {selectedBuilding.building}. This room is currently available for booking.
                </div>
                <button
                  onClick={handleBookClick}
                  disabled={!isRoomAvailable(selectedRoom)}
                  style={{
                    marginTop: 10,
                    padding: '8px 16px',
                    backgroundColor: isRoomAvailable(selectedRoom) ? '#3b82f6' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: isRoomAvailable(selectedRoom) ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                >
                  Book
                </button>
              </div>
            )}
          </div>
        ))}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: 30,
              borderRadius: 10,
              width: 400,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}>
              <h3>Book Room</h3>
              <p>You are booking <strong>{selectedRoom?.name}</strong> on <strong>{selectedFloor?.floor}</strong> in <strong>{selectedBuilding?.building}</strong>.</p>
              <button
                onClick={handleBookClick}
                disabled={!selectedRoom || !isRoomAvailable(selectedRoom)}
                style={{
                  marginTop: 20,
                  padding: '10px 20px',
                  backgroundColor: selectedRoom && isRoomAvailable(selectedRoom) ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: selectedRoom && isRoomAvailable(selectedRoom) ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                Book Now
              </button>
              <button
                onClick={closeModal}
                style={{
                  marginTop: 10,
                  padding: '8px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildingRoomLayout;
