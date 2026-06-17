import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationContext } from '../context/ReservationContext';
import { useModal } from '../context/ModalContext';

const ServicioDetalle = () => {
  const [detalle, setDetalle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const { updateData } = useContext(ReservationContext);
  const { showAlert } = useModal();
  const navigate = useNavigate();
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-PE';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setDetalle((prev) => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      showAlert('Aviso', 'El dictado por voz no está soportado en este navegador.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSelectDuration = async (minutos) => {
    if (!detalle.trim()) {
      await showAlert('Falta Información', 'Por favor, describa brevemente qué busca.');
      return;
    }
    updateData({ servicio: `Otros: ${detalle.trim()}`, duracion_minutos: minutos });
    navigate('/dia');
  };

  return (
    <div className="flex-col-center animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
      <h2>Servicio Específico</h2>
      
      <div className="textarea-wrapper mb-1">
        <textarea 
          className="input-field" 
          style={{ height: '140px', resize: 'none', marginBottom: 0 }}
          placeholder="¿Qué busca y por cuánto tiempo cree que es necesario? (Ej. Instalación de luces LED...)"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
        ></textarea>
        
        <button 
          className={`mic-button ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          title={isRecording ? 'Detener dictado' : 'Dictar por voz'}
        >
          {isRecording ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
          )}
        </button>
      </div>

      <div className="mt-1 mb-1 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Seleccione el tiempo estimado:
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '320px' }}>
        <button className="btn-primary" style={{ padding: '12px', fontSize: '0.95rem' }} onClick={() => handleSelectDuration(30)}>30 min</button>
        <button className="btn-primary" style={{ padding: '12px', fontSize: '0.95rem' }} onClick={() => handleSelectDuration(60)}>1 hora</button>
        <button className="btn-primary" style={{ padding: '12px', fontSize: '0.95rem' }} onClick={() => handleSelectDuration(120)}>2 horas</button>
        <button className="btn-primary" style={{ padding: '12px', fontSize: '0.95rem' }} onClick={() => handleSelectDuration(180)}>3 horas</button>
      </div>
    </div>
  );
};

export default ServicioDetalle;
