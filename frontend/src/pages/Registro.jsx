import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Registro = () => {
  const [dni, setDni] = useState('');
  const [nombres, setNombres] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = () => {
    if (dni.length < 8 || nombres.length < 3) {
      alert("Por favor ingrese un DNI válido y sus nombres completos.");
      return;
    }

    // Animación y éxito (Mock)
    setIsSubscribed(true);
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  if (isSubscribed) {
    return (
      <div className="flex-col-center animate-fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ color: 'var(--primary-gold)' }}>¡Ya eres ClientePuntos!</h2>
        <p>Te regalamos 10 puntos de bienvenida.</p>
        <p className="mt-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Redirigiendo al inicio...</p>
      </div>
    );
  }

  return (
    <div className="flex-col-center animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
      <h2>Únete a <span style={{ color: 'var(--primary-gold)' }}>ClientePuntos</span></h2>
      <p className="text-center mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Acumula puntos por cada sol invertido en el mantenimiento de tu moto y canjéalos por descuentos.
      </p>

      <input 
        type="number" 
        className="input-field" 
        placeholder="DNI" 
        value={dni}
        onChange={(e) => setDni(e.target.value)}
      />
      
      <input 
        type="text" 
        className="input-field" 
        placeholder="Nombres Completos" 
        value={nombres}
        onChange={(e) => setNombres(e.target.value)}
      />

      <button className="btn-primary mt-1" onClick={handleSubscribe}>Suscribirme YA</button>
    </div>
  );
};

export default Registro;
