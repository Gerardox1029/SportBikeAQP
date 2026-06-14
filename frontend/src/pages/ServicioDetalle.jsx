import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationContext } from '../context/ReservationContext';

const ServicioDetalle = () => {
  const [detalle, setDetalle] = useState('');
  const { updateData } = useContext(ReservationContext);
  const navigate = useNavigate();

  const handleSelectDuration = (minutos) => {
    if (!detalle.trim()) {
      alert('Por favor, describa brevemente qué busca.');
      return;
    }
    updateData({ servicio: `Otros: ${detalle}`, duracion_minutos: minutos });
    navigate('/dia');
  };

  return (
    <div className="flex-col-center animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
      <h2>Servicio Específico</h2>
      
      <textarea 
        className="input-field" 
        style={{ height: '120px', resize: 'none', background: 'rgba(255,255,255,0.05)' }}
        placeholder="¿Qué busca y por cuánto tiempo cree que es necesario? (Ej. Instalación de luces LED...)"
        value={detalle}
        onChange={(e) => setDetalle(e.target.value)}
      ></textarea>

      <div className="mt-1 mb-1 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Seleccione el tiempo estimado:
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
        <button className="btn-primary" style={{ padding: '12px' }} onClick={() => handleSelectDuration(30)}>30 min</button>
        <button className="btn-primary" style={{ padding: '12px' }} onClick={() => handleSelectDuration(60)}>1 hora</button>
        <button className="btn-primary" style={{ padding: '12px' }} onClick={() => handleSelectDuration(120)}>2 horas</button>
        <button className="btn-primary" style={{ padding: '12px' }} onClick={() => handleSelectDuration(180)}>3 horas</button>
      </div>
    </div>
  );
};

export default ServicioDetalle;
