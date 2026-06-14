import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationContext } from '../context/ReservationContext';

const ServiceCard = ({ title, price, duration, isOther, onClick }) => {
  const [flipped, setFlipped] = useState(false);

  const handleClick = () => {
    if (isOther) {
      onClick();
      return;
    }
    setFlipped(!flipped);
  };

  return (
    <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={handleClick}>
      <div className="flip-card-inner">
        <div className="flip-card-front">
          <div className="card-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>
          <div className="card-title">{title}</div>
        </div>
        <div className="flip-card-back">
          <div className="card-title">{title}</div>
          <div className="card-price">{price}</div>
          <div className="card-price">{duration}</div>
          <button 
            className="btn-select" 
            onClick={(e) => {
              e.stopPropagation(); // Evitar que haga flip otra vez
              onClick();
            }}
          >
            Elegir este
          </button>
        </div>
      </div>
    </div>
  );
};

const Servicio = () => {
  const { updateData } = useContext(ReservationContext);
  const navigate = useNavigate();

  const handleSelect = (servicio, duracion) => {
    updateData({ servicio, duracion_minutos: duracion });
    navigate('/dia');
  };

  const handleOther = () => {
    navigate('/servicio/detalle');
  };

  return (
    <div className="flex-col-center animate-fade-in" style={{ width: '100%' }}>
      <h2>Elige tu servicio</h2>
      
      <div className="service-grid">
        <ServiceCard 
          title="Mantenimiento" 
          price="S/75" 
          duration="2h" 
          onClick={() => handleSelect('Mantenimiento', 120)} 
        />
        <ServiceCard 
          title="Revisión" 
          price="Costo varía" 
          duration="30m" 
          onClick={() => handleSelect('Revisión', 30)} 
        />
        <ServiceCard 
          title="Reparación" 
          price="Costo varía" 
          duration="1h" 
          onClick={() => handleSelect('Reparación', 60)} 
        />
        <div className="flip-card" onClick={handleOther}>
          <div className="flip-card-inner">
             <div className="flip-card-front" style={{ background: 'var(--surface-color)' }}>
               <div className="card-icon">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <circle cx="12" cy="12" r="10"></circle>
                   <line x1="12" y1="8" x2="12" y2="16"></line>
                   <line x1="8" y1="12" x2="16" y2="12"></line>
                 </svg>
               </div>
               <div className="card-title">Otros</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Servicio;
