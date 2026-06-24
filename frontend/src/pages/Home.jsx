import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationContext } from '../context/ReservationContext';
import { useModal } from '../context/ModalContext';

const Home = () => {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [dni, setDni] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const { updateData } = useContext(ReservationContext);
  const { showAlert } = useModal();
  const navigate = useNavigate();

  const handleNext = async () => {
    // Validate required fields before any server call
    if (
      nombres.trim().length < 2 ||
      apellidos.trim().length < 2 ||
      dni.length !== 8 ||
      whatsapp.length < 9
    ) {
      await showAlert('Aviso', 'Por favor, completa todos los campos correctamente.');
      return;
    }

    // Check server-side if this name corresponds to an admin (no secrets in frontend)
    try {
      const resp = await fetch('/api/auth/check-admin-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombres })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.isAdmin) {
          navigate('/admin');
          return;
        }
      }
      // If not admin (401 or isAdmin false), continue normal flow
    } catch (err) {
      console.error('Error checking admin name', err);
      // In case of server error, fall back to normal flow but do not expose secrets
    }

    updateData({
      nombres,
      apellidos,
      dni,
      telefono: whatsapp,
      nombre_temporal: `${nombres} ${apellidos}`
    });
    navigate('/servicio');
  };

  return (
    <div className="flex-col-center animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
      <h1>Realiza tu Reserva<br />en 3 PASOS</h1>
      <div className="subtitle">SportBikeAQP</div>

      <div className="mt-2" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Nombres"
          value={nombres}
          maxLength={50}
          onChange={(e) => {
            const soloLetras = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
            setNombres(soloLetras.slice(0, 50));
          }}
        />
        <input
          type="text"
          className="input-field"
          placeholder="Apellidos"
          value={apellidos}
          maxLength={50}
          onChange={(e) => {
            const soloLetras = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
            setApellidos(soloLetras.slice(0, 50));
          }}
        />
        <input
          type="number"
          className="input-field"
          placeholder="DNI"
          value={dni}
          maxLength={8}
          onChange={(e) => {
            const soloNumeros = e.target.value.replace(/\D/g, '');
            setDni(soloNumeros.slice(0, 8));
          }}
        />
        <div className="country-selector">
          <select className="country-select" defaultValue="+51">
            <option value="+51">+51</option>
            {/* Add more country codes if necessary */}
          </select>
          <input
            type="tel"
            className="phone-input"
            placeholder="WhatsApp"
            value={whatsapp}
            maxLength={15}
            onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            aria-label="WhatsApp"
          />
        </div>
        <button className="btn-primary mt-1" onClick={handleNext}>Siguiente</button>
      </div>
    </div>
  );
};

export default Home;
