import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal debe usarse dentro de ModalProvider');
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState(null);
  const resolveRef = useRef(null);

  const showAlert = useCallback((message, title = '') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModal({ type: 'alert', message, title });
    });
  }, []);

  const showConfirm = useCallback((message, title = 'Confirmar') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModal({ type: 'confirm', message, title });
    });
  }, []);

  const showPrompt = useCallback((message, title = '', defaultValue = '') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModal({ type: 'prompt', message, title, defaultValue });
    });
  }, []);

  // Mostrar modal para ingresar contraseña (tipo 'password')
  const showPasswordPrompt = useCallback((message, title = '') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModal({ type: 'password', message, title, defaultValue: '' });
    });
  }, []);

  const handleAccept = useCallback((value) => {
    if (resolveRef.current) {
      if (modal?.type === 'prompt' || modal?.type === 'password') resolveRef.current(value);
      else if (modal?.type === 'confirm') resolveRef.current(true);
      else resolveRef.current(true);
    }
    setModal(null);
  }, [modal]);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      if (modal?.type === 'prompt' || modal?.type === 'password') resolveRef.current(null);
      else resolveRef.current(false);
    }
    setModal(null);
  }, [modal]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt, showPasswordPrompt, modal, handleAccept, handleCancel }}>
      {children}
    </ModalContext.Provider>
  );
};
