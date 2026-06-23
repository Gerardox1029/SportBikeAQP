import React, { useState, useEffect } from 'react';
import { useModal } from '../context/ModalContext';

const GlobalModal = () => {
  const { modal, handleAccept, handleCancel } = useModal();
  const [promptValue, setPromptValue] = useState('');
  const [visible, setVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Estado para alternar visibilidad

  useEffect(() => {
    if (modal) {
      setPromptValue(modal.defaultValue || '');
      setShowPassword(false); // Resetear visibilidad al abrir
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [modal]);

  if (!modal) return null;

  const onAccept = () => {
    // Acepta tanto 'prompt' como el nuevo tipo 'password'
    if (modal.type === 'prompt' || modal.type === 'password') {
      handleAccept(promptValue);
    } else {
      handleAccept(true);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') onAccept();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className={`gmodal-overlay ${visible ? 'active' : ''}`} onKeyDown={onKeyDown}>
      <div className={`gmodal-container ${visible ? 'active' : ''}`}>
        <div className="gmodal-accent"></div>

        {modal.title && <h3 className="gmodal-title">{modal.title}</h3>}
        <p className="gmodal-message">{modal.message}</p>

        {/* Soporte para tipo normal y tipo password */}
        {(modal.type === 'prompt' || modal.type === 'password') && (
          <div className="gmodal-input-container" style={{ position: 'relative', width: '100%' }}>
            <input
              type={modal.type === 'password' && !showPassword ? 'password' : 'text'}
              className="gmodal-input"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              autoFocus
              style={{ width: '100%', paddingRight: '40px' }} // Espacio para el ojo
            />
            {modal.type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            )}
          </div>
        )}

        <div className="gmodal-actions">
          {(modal.type === 'confirm' || modal.type === 'prompt' || modal.type === 'password') && (
            <button className="gmodal-btn gmodal-btn-cancel" onClick={handleCancel}>
              Cancelar
            </button>
          )}
          <button className="gmodal-btn gmodal-btn-accept" onClick={onAccept}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalModal;