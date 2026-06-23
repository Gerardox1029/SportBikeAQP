import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

const NavBar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  // Añade aquí la función que use tu contexto para abrir modales interactivos (ej: showPrompt o custom)
  const { showAlert, showPrompt, showPasswordPrompt } = useModal();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await showAlert('Sesión', 'Has cerrado sesión exitosamente.');
    logout();
    navigate('/');
  };

  const handleAdminAccess = async () => {
    try {
      // 1. Invocar el modal personalizado tipo 'password'
      const passwordIngresada = await showPasswordPrompt('Ingrese la contraseña de gestión', 'Modo Administrador');

      if (!passwordIngresada) return; // Si cancela o está vacío, no hace nada

      // 2. Validar contra el backend de manera segura
      const response = await fetch('/api/auth/verify-admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordIngresada }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) navigate('/admin');
        else showAlert('Error de autenticación', data.message || 'Contraseña incorrecta.');
      } else if (response.status === 401) {
        const err = await response.json().catch(() => ({}));
        showAlert('Error de autenticación', err.message || 'Contraseña incorrecta.');
      } else {
        showAlert('Error', 'Hubo un problema con el servidor. Intente nuevamente.');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Hubo un problema al conectar con el servidor.');
    }
  };

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <nav className="client-navbar">
      <Link to="/" className="nav-brand" style={{ textDecoration: 'none' }}>
        SPORTBIKE<span style={{ color: 'var(--text-main)' }}>AQP</span>
      </Link>

      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Inicio
        </Link>

        {isAuthenticated ? (
          <>
            <Link to="/mis-reservas" className={`nav-link ${location.pathname === '/mis-reservas' ? 'active' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Mis Reservas
              <span style={{ marginLeft: '4px', background: 'var(--primary-gold)', color: '#000', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                {user?.puntos || 0} pts
              </span>
            </Link>
            <button onClick={handleLogout} className="nav-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Salir
            </button>
          </>
        ) : (
          /* Cambiado de Link a button para controlar la lógica del modal */
          <button
            onClick={handleAdminAccess}
            className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Admin
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;