import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // No mostrar botón de atrás en Home o Login/Admin main
  if (location.pathname === '/' || location.pathname === '/admin') {
    return null;
  }

  return (
    <button className="back-button" onClick={() => navigate(-1)} aria-label="Volver">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
};

export default BackButton;
