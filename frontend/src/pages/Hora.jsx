import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationContext } from '../context/ReservationContext';
import { useModal } from '../context/ModalContext';

const Hora = () => {
  const { reservationData, updateData } = useContext(ReservationContext);
  const { showAlert } = useModal();
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState(null); // { h: number, m: number, str: string }
  const [reservations, setReservations] = useState([]);
  const svgRef = useRef(null);

  // Fetch reservations to block occupied slots
  useEffect(() => {
    if (reservationData.fecha) {
      fetch(`/api/reservations?fecha=${reservationData.fecha}`)
        .then(r => r.json())
        .then(data => setReservations(data))
        .catch(console.error);
    }
  }, [reservationData.fecha]);

  const formatAMPM = (h, m) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const minStr = m === 0 ? '00' : '30';
    return `${hour12}:${minStr} ${ampm}`;
  };

  const isTimeAllowed = (h, m) => {
    // 8 AM (8) to 12 PM (12) and 1 PM (13) to 5 PM (17)
    const withinRange = (h >= 8 && h <= 12) || (h >= 13 && h <= 17);
    if (!withinRange) return false;

    // Si es hoy, validar que la hora no haya pasado
    const todayStr = new Date().toISOString().split('T')[0];
    if (reservationData.fecha === todayStr) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      
      if (h < currentHour) return false;
      if (h === currentHour && m <= currentMin) return false;
    }
    
    return true;
  };

  const isTimeOccupied = (h, m) => {
    // Simplistic check for overlapping based on start time
    // For a robust system, we check if [h, m] falls within any existing reservation
    const timeInMins = h * 60 + m;
    
    for (const res of reservations) {
      const [resH, resM] = res.hora_inicio.split(/[: ]/);
      let resStartMins = parseInt(resH) * 60 + parseInt(resM);
      if (res.hora_inicio.includes('PM') && resH !== '12') resStartMins += 12 * 60;
      if (res.hora_inicio.includes('AM') && resH === '12') resStartMins -= 12 * 60;
      
      const resEndMins = resStartMins + res.duracion_minutos;
      
      if (timeInMins >= resStartMins && timeInMins < resEndMins) return true;
    }
    return false;
  };

  const calculateTimeFromAngle = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);

    // atan2 is from -PI to PI
    let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    
    // Shift so that Top (12:00) is 0 degrees
    let normalizedAngle = angle + 90;
    if (normalizedAngle < 0) normalizedAngle += 360;

    // 1 hour = 30 degrees
    let timeInHours = normalizedAngle / 30;
    if (timeInHours === 0) timeInHours = 12;

    let hour12 = Math.floor(timeInHours);
    if (hour12 === 0) hour12 = 12;
    
    // Nearest 30 mins
    let minute = (timeInHours % 1) >= 0.5 ? 30 : 0;

    // Convert to 24h internally to check restrictions
    let hour24 = hour12;
    if (hour12 >= 1 && hour12 <= 5) hour24 += 12; // PM times
    
    if (isTimeAllowed(hour24, minute) && !isTimeOccupied(hour24, minute)) {
      setSelectedTime({
        h: hour24,
        m: minute,
        str: formatAMPM(hour24, minute)
      });
    }
  };

  const handleInteractionStart = (e) => calculateTimeFromAngle(e);
  const handleInteractionMove = (e) => {
    if (e.buttons !== 1 && e.type !== 'touchmove') return;
    calculateTimeFromAngle(e);
  };

  const handleFinalize = async () => {
    if (!selectedTime) {
      await showAlert('Aviso', "Selecciona una hora.");
      return;
    }

    // Calcular hora de fin
    const startDate = new Date();
    startDate.setHours(selectedTime.h, selectedTime.m, 0, 0);
    const endDate = new Date(startDate.getTime() + reservationData.duracion_minutos * 60000);
    
    const hora_inicio_str = selectedTime.str;
    const hora_fin_str = formatAMPM(endDate.getHours(), endDate.getMinutes());

    updateData({ hora_inicio: hora_inicio_str, hora_fin: hora_fin_str });

    // Guardar en backend
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_temporal: reservationData.nombre_temporal,
          servicio: reservationData.servicio,
          fecha: reservationData.fecha,
          hora_inicio: hora_inicio_str,
          hora_fin: hora_fin_str,
          duracion_minutos: reservationData.duracion_minutos
        })
      });

      if (res.ok) {
        navigate('/exito');
      } else {
        const err = await res.json();
        await showAlert('Error', err.error || "Error al crear la reserva");
      }
    } catch (e) {
      console.error(e);
      await showAlert('Error', "Error de red.");
    }
  };

  // Generar marcas visuales para las horas del reloj (1 al 12)
  const renderClockNumbers = () => {
    const numbers = [];
    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30) - 90; // Top is -90
      const rad = angle * (Math.PI / 180);
      const x = 140 + 90 * Math.cos(rad); // R=90
      const y = 140 + 90 * Math.sin(rad);
      
      // Determinar si la hora está bloqueada
      let h24 = i;
      if (i >= 1 && i <= 5) h24 += 12;
      
      const allowed = isTimeAllowed(h24, 0);
      
      numbers.push(
        <text 
          key={i} 
          x={x} 
          y={y + 5} 
          fill={allowed ? "var(--text-main)" : "var(--surface-border)"} 
          fontSize="14" 
          fontWeight="bold" 
          textAnchor="middle"
        >
          {i}
        </text>
      );
    }
    return numbers;
  };

  // Calcular end time visualmente
  let endStr = '--:--';
  if (selectedTime) {
    const startDate = new Date();
    startDate.setHours(selectedTime.h, selectedTime.m, 0, 0);
    const endDate = new Date(startDate.getTime() + reservationData.duracion_minutos * 60000);
    endStr = formatAMPM(endDate.getHours(), endDate.getMinutes());
  }

  // Calculate selected pointer position
  let pointerX = 140;
  let pointerY = 140;
  if (selectedTime) {
    let hour12 = selectedTime.h % 12 || 12;
    let angle = (hour12 * 30) + (selectedTime.m === 30 ? 15 : 0) - 90;
    let rad = angle * (Math.PI / 180);
    pointerX = 140 + 60 * Math.cos(rad);
    pointerY = 140 + 60 * Math.sin(rad);
  }

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
           style={{ touchAction: 'none' }}
      >
        <svg width="280" height="280" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r="120" fill="none" stroke="var(--surface-border)" strokeWidth="4" />
          
          {renderClockNumbers()}
          
          {selectedTime && (
            <>
              <line 
                x1="140" y1="140" 
                x2={pointerX} 
                y2={pointerY} 
                stroke="var(--primary-gold)" 
                strokeWidth="4" 
              />
              <circle 
                cx={pointerX} 
                cy={pointerY} 
                r="10" 
                fill="var(--primary-gold)" 
              />
            </>
          )}
          <circle cx="140" cy="140" r="8" fill="var(--primary-gold)" />
        </svg>

        <div style={{ position: 'absolute', bottom: '-70px', textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-gold)' }}>
            Inicio: {selectedTime ? selectedTime.str : '--:--'}
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '5px' }}>
            Fin: {endStr}
          </div>
        </div>
      </div>

      <div className="mt-2" style={{ width: '100%', maxWidth: '320px', marginTop: '90px' }}>
         <button className="btn-primary" onClick={handleFinalize}>Finalizar reserva</button>
      </div>
    </div>
  );
};

export default Hora;
