import React from 'react';

const RoomLayoutModal = ({ room, onClose }) => {
  if (!room) return null;

  // Placeholder 2D layout for demonstration
  // This can be replaced with SVG or canvas-based interactive layout
  return (
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
        padding: 20,
        borderRadius: 8,
        width: '80%',
        maxWidth: 800,
        maxHeight: '80%',
        overflowY: 'auto',
        boxShadow: '0 0 10px rgba(0,0,0,0.25)'
      }}>
        <h2>{room.name} - 2D Layout</h2>
        <div style={{
          border: '1px solid #ccc',
          height: 400,
          position: 'relative',
          backgroundColor: '#f0f0f0'
        }}>
          {/* Example clickable desks */}
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              style={{
                width: 50,
                height: 50,
                backgroundColor: '#007bff',
                borderRadius: 4,
                position: 'absolute',
                top: 20 + Math.floor(i / 5) * 70,
                left: 20 + (i % 5) * 70,
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                userSelect: 'none'
              }}
              onClick={() => alert(`Desk ${i + 1} clicked in ${room.name}`)}
              title={`Desk ${i + 1}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ marginTop: 20, padding: '8px 16px' }}>Close</button>
      </div>
    </div>
  );
};

export default RoomLayoutModal;
