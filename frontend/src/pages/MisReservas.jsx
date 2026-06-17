import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

const MisReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated, token } = useContext(AuthContext);
  const { showAlert, showConfirm } = useModal();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchReservas = async () => {
      try {
        const response = await fetch('/api/auth/my-reservations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener reservas');
        }

        const data = await response.json();
        setReservas(data);
      } catch (error) {
        console.error(error);
        await showAlert('Error', 'No pudimos cargar tus reservas. Intenta nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservas();
  }, [isAuthenticated, navigate, token, showAlert]);

  const handleCancel = async (id) => {
    const confirmed = await showConfirm(
      'Cancelar Reserva', 
      '¿Estás seguro que deseas cancelar esta reserva? Esta acción no se puede deshacer.'
    );

    if (confirmed) {
      try {
        const response = await fetch(`/api/reservations/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Error al cancelar');

        await showAlert('Éxito', 'La reserva fue cancelada correctamente.');
        setReservas(reservas.filter(r => r._id !== id));
      } catch (error) {
        console.error(error);
        await showAlert('Error', 'No se pudo cancelar la reserva.');
      }
    }
  };

  const getStatusBadge = (reserva) => {
    // Lógica simple de estado basado en fecha
    const fechaReserva = new Date(`${reserva.fecha}T${reserva.hora_inicio}`);
    const ahora = new Date();

    if (fechaReserva < ahora) {
      return <span className="reserva-badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>Completado</span>;
    } else {
      return <span className="reserva-badge pending">Pendiente</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-col-center animate-fade-in" style={{ marginTop: '100px' }}>
        <div className="spinner"></div>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Cargando tus reservas...</p>
      </div>
    );
  }

  return (
    <div className="flex-col-center animate-fade-in" style={{ width: '100%', maxWidth: '500px', paddingTop: '80px', paddingBottom: '40px' }}>
      <h2>Mis <span style={{ color: 'var(--primary-gold)' }}>Reservas</span></h2>
      <p className="text-center mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
        Hola, {user?.nombre}. Aquí tienes el historial de tus citas.
      </p>

      {reservas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗓️</div>
          <h3>No tienes reservas aún</h3>
          <p className="mt-1" style={{ fontSize: '0.9rem' }}>Agenda tu primer servicio y mantén tu bici al 100%.</p>
          <button className="btn-primary mt-2" onClick={() => navigate('/')}>Agendar Ahora</button>
        </div>
      ) : (
        <div className="reservas-list">
          {reservas.map((reserva) => (
            <div key={reserva._id} className="reserva-card">
              <div className="reserva-header">
                <div className="reserva-service">{reserva.servicio}</div>
                {getStatusBadge(reserva)}
              </div>
              
              <div className="reserva-info">
                <div className="reserva-info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {reserva.fecha}
                </div>
                <div className="reserva-info-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {reserva.hora_inicio} - {reserva.hora_fin}
                </div>
              </div>

              {/* Solo permitir cancelar si no ha pasado */}
              {new Date(`${reserva.fecha}T${reserva.hora_inicio}`) > new Date() && (
                <div className="reserva-actions">
                  <button className="btn-cancel-res" onClick={() => handleCancel(reserva._id)}>
                    Cancelar Reserva
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisReservas;
