import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationContext } from '../context/ReservationContext';

const Hora = () => {
  const { reservationData, updateData } = useContext(ReservationContext);
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState(null);
  
  // Available times for demo: 8:00 AM to 5:00 PM (17:00) with 30 min jumps
  const hours = [];
  for (let h = 8; h <= 17; h++) {
    hours.push(`${h}:00`);
    if (h !== 17) hours.push(`${h}:30`);
  }

  const svgRef = useRef(null);

  const calculateTimeFromAngle = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);

    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;
    const normalizedAngle = angle < 0 ? angle + 360 : angle;

    // We have 19 time slots (8:00 to 17:00) mapped to 360 degrees.
    // Let's simplify and just map angle to index
    const index = Math.round((normalizedAngle / 360) * (hours.length - 1));
    const safeIndex = Math.max(0, Math.min(hours.length - 1, index));
    setSelectedTime(hours[safeIndex]);
  };

  const handleInteractionStart = (e) => {
    calculateTimeFromAngle(e);
  };

  const handleInteractionMove = (e) => {
    if (e.buttons !== 1 && e.type !== 'touchmove') return; // only track if dragging
    calculateTimeFromAngle(e);
  };

  const handleFinalize = async () => {
    if (!selectedTime) {
      alert("Selecciona una hora.");
      return;
    }

    // Calculate end time
    const [h, m] = selectedTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + reservationData.duracion_minutos);
    const endTime = `${date.getHours()}:${date.getMinutes() === 0 ? '00' : date.getMinutes()}`;

    updateData({ hora_inicio: selectedTime, hora_fin: endTime });

    // En un caso real, aquí hacemos POST al backend.
    // fetch('/api/reservations', { ... })
    
    navigate('/exito');
  };

  return (
    <div className="flex-col-center animate-fade-in" style={{ width: '100%' }}>
      <h2>Selecciona la hora</h2>
      <div className="subtitle" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Desliza por el círculo</div>
      
      <div className="clock-container" 
           ref={svgRef}
           onMouseDown={handleInteractionStart}
           onMouseMove={handleInteractionMove}
           onTouchStart={handleInteractionStart}
           onTouchMove={handleInteractionMove}
           style={{ touchAction: 'none' }} // Prevent scrolling while dragging
      >
        <svg width="280" height="280" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r="120" fill="none" stroke="var(--surface-border)" strokeWidth="20" />
          {/* Aro de disponibilidad mockeado (verde/rojo) */}
          <circle cx="140" cy="140" r="120" fill="none" stroke="var(--status-green)" strokeWidth="20" strokeDasharray="377" strokeDashoffset="0" opacity="0.5" />
          
          {selectedTime && (
            <>
              <line 
                x1="140" y1="140" 
                x2={140 + 100 * Math.cos((hours.indexOf(selectedTime) / (hours.length - 1)) * 2 * Math.PI - Math.PI / 2)} 
                y2={140 + 100 * Math.sin((hours.indexOf(selectedTime) / (hours.length - 1)) * 2 * Math.PI - Math.PI / 2)} 
                stroke="var(--primary-gold)" 
                strokeWidth="4" 
              />
              <circle 
                cx={140 + 100 * Math.cos((hours.indexOf(selectedTime) / (hours.length - 1)) * 2 * Math.PI - Math.PI / 2)} 
                cy={140 + 100 * Math.sin((hours.indexOf(selectedTime) / (hours.length - 1)) * 2 * Math.PI - Math.PI / 2)} 
                r="10" 
                fill="var(--primary-gold)" 
              />
            </>
          )}
          <circle cx="140" cy="140" r="8" fill="var(--primary-gold)" />
        </svg>

        <div style={{ position: 'absolute', bottom: '-40px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-gold)' }}>
          {selectedTime ? `${selectedTime}` : '--:--'}
        </div>
      </div>

      <div className="mt-2" style={{ width: '100%', maxWidth: '320px', marginTop: '60px' }}>
         <button className="btn-primary" onClick={handleFinalize}>Finalizar reserva</button>
      </div>
    </div>
  );
};

export default Hora;
