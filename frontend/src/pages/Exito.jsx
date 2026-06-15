import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationContext } from '../context/ReservationContext';

const Exito = () => {
  const { reservationData } = useContext(ReservationContext);
  const navigate = useNavigate();

  return (
    <div className="flex-col-center animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
      <div className="check-container">
        <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <h2>¡Listo {reservationData.nombre_temporal}!</h2>
      <div className="subtitle" style={{ color: 'var(--status-green)' }}>Reserva Exitosa</div>

      <div className="week-container text-center mt-2" style={{ textAlign: 'left' }}>
        <p><strong>Servicio:</strong> {reservationData.servicio}</p>
        <p><strong>Fecha:</strong> {reservationData.fecha}</p>
        <p><strong>Hora:</strong> {reservationData.hora_inicio} - {reservationData.hora_fin}</p>
        <p className="mt-1">
          <strong>Dirección:</strong><br/>
          <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="link-gold">Ver en Google Maps</a>
        </p>
      </div>

      <div className="mt-2" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button className="btn-primary" onClick={() => navigate('/')}>Volver al Inicio</button>
      </div>
    </div>
  );
};

export default Exito;
