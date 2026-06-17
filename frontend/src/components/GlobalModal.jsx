import React, { useState, useEffect } from 'react';
import { useModal } from '../context/ModalContext';

const GlobalModal = () => {
  const { modal, handleAccept, handleCancel } = useModal();
  const [promptValue, setPromptValue] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (modal) {
      setPromptValue(modal.defaultValue || '');
      // Trigger animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [modal]);

  if (!modal) return null;

  const onAccept = () => {
    if (modal.type === 'prompt') {
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
        {/* Decorative top accent */}
        <div className="gmodal-accent"></div>

        {modal.title && <h3 className="gmodal-title">{modal.title}</h3>}
        <p className="gmodal-message">{modal.message}</p>

        {modal.type === 'prompt' && (
          <input
            type="text"
            className="gmodal-input"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            autoFocus
          />
        )}

        <div className="gmodal-actions">
          {(modal.type === 'confirm' || modal.type === 'prompt') && (
            <button className="gmodal-btn gmodal-btn-cancel" onClick={handleCancel}>
              Cancelar
            </button>
          )}
          <button className="gmodal-btn gmodal-btn-accept" onClick={onAccept} autoFocus={modal.type !== 'prompt'}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalModal;
