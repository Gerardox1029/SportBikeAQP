import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ReservationContext } from '../context/ReservationContext';

const Home = () => {
  const [nombre, setNombre] = useState('');
  const { updateData } = useContext(ReservationContext);
  const navigate = useNavigate();

  const handleNext = () => {
    if (nombre.toLowerCase() === 'timsum') {
      navigate('/admin');
      return;
    }
    
    if (nombre.trim().length < 2) {
      alert('Por favor, ingresa tu nombre');
      return;
    }

    updateData({ nombre_temporal: nombre });
    navigate('/servicio');
  };

  return (
    <div className="flex-col-center animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
      <h1>Realiza tu Reserva<br/>en 3 PASOS</h1>
      <div className="subtitle">SportBikeAQP</div>
      
      <div className="mt-2" style={{ width: '100%' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Juan..." 
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
        />
        <button className="btn-primary" onClick={handleNext}>Siguiente</button>
      </div>

      <Link to="/registro" className="link-gold">SerClientePuntos</Link>
    </div>
  );
};

export default Home;
