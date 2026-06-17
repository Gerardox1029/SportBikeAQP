import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext';

const AdminWhatsApp = () => {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('initializing');
  const [loading, setLoading] = useState(true);
  const { showAlert } = useModal();

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/qr');
      if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
      const data = await res.json();
      
      setStatus(data.status);
      if (data.qr) setQr(data.qr);
      else setQr(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Poll every 5 seconds for QR or status changes
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTestMessage = async () => {
    await showAlert('Aviso', 'Funcionalidad de prueba pronto...');
  };

  if (loading) {
    return (
      <div className="flex-col-center">
        <div className="spinner"></div>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Cargando estado de WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Configuración WhatsApp</h2>
          <p className="admin-page-subtitle">Conecta tu número para enviar recordatorios y notificaciones automáticas.</p>
        </div>
        <div>
          <div className={`wa-status-badge ${status === 'connected' ? 'connected' : 'disconnected'}`}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
            {status === 'connected' ? 'Conectado' : (status === 'waiting_scan' ? 'Esperando QR' : 'Inicializando...')}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        <div className="agenda-card" style={{ flex: 1 }}>
          <h3 className="agenda-card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            Vincular Dispositivo
          </h3>
          
          {status === 'connected' ? (
            <div className="text-center" style={{ padding: '40px 20px' }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--status-green)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 style={{ marginBottom: '10px' }}>¡WhatsApp Vinculado Exitosamente!</h3>
              <p style={{ color: 'var(--text-muted)' }}>El bot está activo y enviará notificaciones automáticas.</p>
              <button className="btn-primary mt-2" onClick={handleTestMessage}>Probar Mensaje</button>
            </div>
          ) : (
            <div className="wa-instructions">
              {qr ? (
                <>
                  <p>Escanea este código QR desde la aplicación de WhatsApp en tu celular.</p>
                  <div className="wa-qr-container">
                    <img src={qr} alt="WhatsApp QR Code" />
                  </div>
                  <ol>
                    <li>Abre WhatsApp en tu celular.</li>
                    <li>Toca menú o configuración y selecciona <strong>Dispositivos vinculados</strong>.</li>
                    <li>Toca en <strong>Vincular un dispositivo</strong>.</li>
                    <li>Apunta la pantalla de tu celular a este código QR.</li>
                  </ol>
                </>
              ) : (
                <div className="text-center" style={{ padding: '60px 20px' }}>
                  <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                  <p>Generando código QR...</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="agenda-side" style={{ width: '380px' }}>
          <div className="agenda-card">
            <h3 className="agenda-card-title">Información del Servicio</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              El bot de SportBikeAQP utiliza WhatsApp Web de fondo. 
              Debe permanecer conectado a internet para enviar mensajes.
              <br/><br/>
              <strong>Funciones activas:</strong>
              <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <li>Envío de OTP (Código de 6 dígitos)</li>
                <li>Recordatorios diarios a las 6:00 AM</li>
                <li>Mensajes de bienvenida</li>
              </ul>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWhatsApp;
