import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ReservationContext } from '../context/ReservationContext';
import { useModal } from '../context/ModalContext';

const Home = () => {
  const [nombre, setNombre] = useState('');
  const { updateData } = useContext(ReservationContext);
  const { showAlert } = useModal();
  const navigate = useNavigate();

  const handleNext = async () => {
    if (nombre.toLowerCase() === 'timsum') {
      navigate('/admin');
      return;
    }
    
    if (nombre.trim().length < 2) {
      await showAlert('Aviso', 'Por favor, ingresa tu nombre para continuar.');
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

      <Link to="/login" className="link-gold">Ingresar / Registrarse</Link>
    </div>
  );
};

export default Home;
