import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Select from 'react-select';
import { format, addMinutes } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const BookingForm = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [numSlots, setNumSlots] = useState(1);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [purpose, setPurpose] = useState('');
  const [currentDate, setCurrentDate] = useState(() => {
    if (location.state && location.state.selectedDate) {
      return location.state.selectedDate;
    }
    return new Date().toISOString().split('T')[0];
  });
  const [availability, setAvailability] = useState([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch buildings on mount
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await api.get('/buildings');
        setBuildings(response.data.map(b => ({ value: b.id, label: b.name })));
      } catch (err) {
        setError('Failed to fetch buildings');
      }
    };
    fetchBuildings();
  }, []);

  // Prefill from location state
  useEffect(() => {
    if (location.state && buildings.length > 0) {
      const { buildingId, floorId } = location.state;
      if (buildingId) {
        const building = buildings.find(b => b.value === buildingId);
        if (building) {
          setSelectedBuilding(building);
          // Fetch floors
          api.get(`/floors?buildingId=${buildingId}`).then(res => {
            setFloors(res.data.map(f => ({ value: f.id, label: `Floor ${f.floor_number}` })));
            if (floorId) {
              const floor = res.data.find(f => f.id === floorId);
              if (floor) {
                setSelectedFloor({ value: floor.id, label: `Floor ${floor.floor_number}` });
              }
            }
          }).catch(err => setError('Failed to fetch floors'));
        }
      }
    }
  }, [location.state, buildings]);

  // On building change
  const handleBuildingChange = (selected) => {
    setSelectedBuilding(selected);
    setSelectedFloor(null);
    setAvailability([]);
    setSelectedSlots([]);
    if (selected) {
      api.get(`/floors?buildingId=${selected.value}`).then(res => {
        setFloors(res.data.map(f => ({ value: f.id, label: `Floor ${f.floor_number}` })));
      }).catch(err => setError('Failed to fetch floors'));
    } else {
      setFloors([]);
    }
  };

  // On floor change
  const handleFloorChange = (selected) => {
    setSelectedFloor(selected);
    setAvailability([]);
    setSelectedSlots([]);
    setIsLoadingAvailability(false);
  };

  // Fetch availability when selectedFloor or currentDate changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedFloor) {
        setAvailability([]);
        return;
      }
      setIsLoadingAvailability(true);
      setError('');
      try {
        const res = await api.get(`/bookings/availability?floorId=${selectedFloor.value}&date=${currentDate}`);
        setAvailability(res.data.rooms);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch availability');
      } finally {
        setIsLoadingAvailability(false);
      }
    };
    fetchAvailability();
  }, [selectedFloor, currentDate]);

  // Generate time slots: 9AM to 6PM, 15 min intervals
  const generateTimeSlots = useCallback(() => {
    const slots = [];
    let current = new Date(currentDate);
    current.setHours(9, 0, 0, 0);
    const end = new Date(currentDate);
    end.setHours(18, 0, 0, 0);
    while (current < end) {
      slots.push(new Date(current));
      current = addMinutes(current, 15);
    }
    return slots;
  }, [currentDate]);

  // Is slot booked for a room? (proper overlap check with timezone-safe comparison)
  const isSlotBooked = useCallback((roomId, slotTime) => {
    const room = availability.find(r => r.id === roomId);
    if (!room) return false;
    const slotEnd = addMinutes(slotTime, 15);
    const slotStartMs = slotTime.getTime();
    const slotEndMs = slotEnd.getTime();
    return room.bookedIntervals.some(interval => {
      const intStart = new Date(interval.start).getTime();
      const intEnd = new Date(interval.end).getTime();
      return !(slotEndMs <= intStart || slotStartMs >= intEnd);
    });
  }, [availability]);

  // Is slot selected?
  const isSlotSelected = (roomId, slotTime) => {
    return selectedSlots.some(slot => slot.roomId === roomId && slot.startTime.getTime() === slotTime.getTime());
  };

  // Get selected block info for status
  const getSelectedBlockInfo = () => {
    if (selectedSlots.length === 0) return null;
    const room = availability.find(r => r.id === selectedSlots[0].roomId);
    const startTime = selectedSlots[0].startTime;
    const endTime = addMinutes(selectedSlots[selectedSlots.length - 1].startTime, 15);
    return {
      roomName: room ? room.name : 'Unknown Room',
      start: format(startTime, 'HH:mm'),
      end: format(endTime, 'HH:mm')
    };
  };

  // Handle cell click
  const handleCellClick = (roomId, slotTime) => {
    const isBooked = isSlotBooked(roomId, slotTime);
    const isPast = slotTime < new Date();
    const isDisabled = isBooked || isPast;
    if (isDisabled) return;

    const isSelected = isSlotSelected(roomId, slotTime);
    if (isSelected) {
      // Deselect all if clicking a selected slot
      setSelectedSlots([]);
      setError('');
    } else {
      // Always clear and start new selection from this slot
      const timeSlots = generateTimeSlots();
      const slotIndex = timeSlots.findIndex(slot => slot.getTime() === slotTime.getTime());
      if (slotIndex === -1) return;

      // Check if we can select numSlots continuous starting from this slot
      const endIndex = slotIndex + numSlots;
      if (endIndex > timeSlots.length) {
        setError(`Not enough slots available from this time. Need ${numSlots} continuous slots.`);
        return;
      }
      const slotsToSelect = timeSlots.slice(slotIndex, endIndex);
      const allFree = slotsToSelect.every(slot => {
        const booked = isSlotBooked(roomId, slot);
        const past = slot < new Date();
        return !booked && !past;
      });
      if (allFree) {
        setSelectedSlots(slotsToSelect.map(slot => ({ roomId, startTime: slot })));
        setError('');
      } else {
        setError(`Cannot select ${numSlots} continuous slots from this time due to bookings or past times.`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSlots.length < numSlots) {
      setError('Not enough slots selected');
      return;
    }
    if (!purpose.trim()) {
      setError('Purpose is required');
      return;
    }
    setLoading(true);
    setError('');
    const roomId = selectedSlots[0].roomId;
    const startTime = selectedSlots[0].startTime;
    const endTime = addMinutes(selectedSlots[selectedSlots.length - 1].startTime, 15);
    try {
      await api.post('/bookings', {
        room_id: roomId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        purpose,
      });
      setSuccess('Booking submitted successfully!');
      setSelectedSlots([]);
      setPurpose('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">
                <i className="bi bi-calendar-plus"></i> Room Booking
              </h2>
              <p className="mb-0">Welcome, {user.name}</p>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              <form onSubmit={handleSubmit}>
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label>Select Building</label>
                    <Select options={buildings} value={selectedBuilding} onChange={handleBuildingChange} placeholder="Building" isClearable />
                  </div>
                  <div className="col-md-3">
                    <label>Select Floor</label>
                    <Select options={floors} value={selectedFloor} onChange={handleFloorChange} placeholder="Floor" isClearable isDisabled={!selectedBuilding} />
                  </div>
                  <div className="col-md-2">
                    <label>Slots (15 min each)</label>
                    <select className="form-select" value={numSlots} onChange={(e) => setNumSlots(parseInt(e.target.value))}>
                      {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label>Date</label>
                    <input type="date" className="form-control" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => { setSelectedFloor(null); setAvailability([]); setSelectedSlots([]); }}>Clear</button>
                  </div>
                </div>
                {selectedFloor && (
                  <div className="mb-4">
                    <h5>Availability Table (9AM - 6PM)</h5>
                    {isLoadingAvailability ? (
                      <div className="alert alert-info">Loading availability...</div>
                    ) : availability.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Time</th>
                              {availability.map(room => <th key={room.id}>{room.name}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {timeSlots.map(slot => (
                              <tr key={slot.getTime()}>
                                <td>{format(slot, 'HH:mm')}</td>
                                {availability.map(room => {
                                const isBooked = isSlotBooked(room.id, slot);
                                const isPast = slot < new Date();
                                const isDisabled = isBooked || isPast;
                                const isSelected = isSlotSelected(room.id, slot);
                                const cellClass = isDisabled ? 'bg-secondary text-white' : isSelected ? 'bg-primary text-white' : 'bg-white';
                                const cellStyle = {
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  ...(isSelected && { borderLeft: '4px solid #007bff' })
                                };
                                return (
                                  <td key={room.id} className={cellClass} style={cellStyle} onClick={() => !isDisabled && handleCellClick(room.id, slot)}>
                                    {isSelected ? 'Selected' : isDisabled ? (isPast ? 'Time Out' : 'Booked') : ''}
                                  </td>
                                );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="alert alert-info">No rooms available on this floor.</div>
                    )}
                    {availability.length > 0 && (
                      <p className="text-muted">
                      {selectedSlots.length > 0 ? (
                        (() => {
                          const info = getSelectedBlockInfo();
                          return `Continuous block selected: ${info.start} to ${info.end} in ${info.roomName}`;
                        })()
                      ) : (
                        `Select a starting time slot for ${numSlots} continuous slots`
                      )}
                    </p>
                    )}
                  </div>
                )}
                <div className="mb-3">
                  <label htmlFor="purpose">Purpose</label>
                  <textarea className="form-control" id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} rows="3" placeholder="Enter purpose..." required />
                </div>
                <button type="submit" className="btn btn-success w-100" disabled={loading || selectedSlots.length < numSlots || !purpose.trim()}>
                  {loading ? 'Submitting...' : 'Submit Booking'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;