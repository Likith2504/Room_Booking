import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BuildingRoomLayout = () => {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  const staticData = [
    {
      building: "Meerlan Tower",
      floors: [
        {
          floor: "2nd Floor",
          rooms: ["Conference Room"]
        },
        {
          floor: "3rd Floor",
          rooms: ["Training Room", "Conference Room", "Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6", "Room 7"]
        }
      ]
    },
    {
      building: "No 5/2",
      floors: [
        {
          floor: "Ground Floor",
          rooms: ["Conference Room"]
        }
      ]
    }
  ];

  const handleBuildingClick = (building) => {
    setSelectedBuilding(building);
    setSelectedFloor(null);
    setSelectedRoom(null);
  };

  const handleFloorClick = (floor) => {
    setSelectedFloor(floor);
    setSelectedRoom(null);
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleBookClick = () => {
    setShowModal(false);
    navigate('/booking');
  };

  return (
    <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center', padding: '20px' }}>
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
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: '600', fontSize: '1.3rem' }}>
            <span role="img" aria-label="building">🏢</span> {b.building}
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
                  const isSelected = selectedRoom === r && selectedFloor === f.floor && selectedBuilding === b.building;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        handleBuildingClick(b.building);
                        handleFloorClick(f.floor);
                        handleRoomClick(r);
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db',
                        backgroundColor: isSelected ? '#3b82f6' : 'white',
                        color: isSelected ? 'white' : '#374151',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 0 10px rgba(59,130,246,0.7)' : 'none',
                        flex: '1 0 30%',
                        minWidth: 110,
                        textAlign: 'center',
                        userSelect: 'none',
                        fontWeight: '500',
                        fontSize: '0.9rem'
                      }}
                    >
                      <div>{r}</div>
                      <div style={{ fontSize: 13, color: isSelected ? '#bfdbfe' : '#10b981', marginTop: 4 }}>Available</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {selectedRoom && selectedBuilding === b.building && (
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
              Room Selected: {selectedRoom}
              <div style={{ fontWeight: 'normal', fontSize: 15, marginTop: 6 }}>
                You&apos;ve selected {selectedRoom} on {selectedFloor} in {selectedBuilding}. This room is currently available for booking.
              </div>
              <button
                onClick={handleBookClick}
                style={{
                  marginTop: 10,
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
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
            <p>You are booking <strong>{selectedRoom}</strong> on <strong>{selectedFloor}</strong> in <strong>{selectedBuilding}</strong>.</p>
            <button
              onClick={handleBookClick}
              style={{
                marginTop: 20,
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
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
  );
};

export default BuildingRoomLayout;
