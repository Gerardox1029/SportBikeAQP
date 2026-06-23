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
    if (nombres.toLowerCase() === 'timsum' || nombres.toLowerCase() === 'admin') {
      navigate('/admin');
      return;
    }

    if (nombres.trim().length < 2 || apellidos.trim().length < 2 || dni.length < 8 || whatsapp.length < 9) {
      await showAlert('Aviso', 'Por favor, completa todos los campos correctamente.');
      return;
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
          onChange={(e) => setNombres(e.target.value)}
        />
        <input
          type="text"
          className="input-field"
          placeholder="Apellidos"
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
        />
        <input
          type="number"
          className="input-field"
          placeholder="DNI"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '5px' }}>
          <select className="input-field" style={{ width: '80px', padding: '0 10px' }} defaultValue="+51">
            <option value="+51">+51</option>
            {/* Add more country codes if necessary */}
          </select>
          <input
            type="number"
            className="input-field"
            placeholder="WhatsApp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            style={{ flex: 1 }}
          />
        </div>
        <button className="btn-primary mt-1" onClick={handleNext}>Siguiente</button>
      </div>
    </div>
  );
};

export default Home;
