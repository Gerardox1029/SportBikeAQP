import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+51');
  const [step, setStep] = useState(1); // 1: Phone, 2: Code
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  const { showAlert } = useModal();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (phone.length < 9) {
      await showAlert('Error', 'Por favor, ingresa un número de teléfono válido.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: phone, codigoPais: countryCode })
      });

      const data = await response.json();
      
      if (!response.ok) {
        await showAlert('Error', data.error || 'No se pudo enviar el código.');
        return;
      }

      setStep(2);
      
      // En entorno de desarrollo (o por facilidad temporal), si devuelve debug_code, lo podemos mostrar
      if (data.debug_code) {
        console.log('Código de verificación:', data.debug_code);
        // Descomentar para facilitar pruebas:
        // await showAlert('Modo Dev', `Tu código es: ${data.debug_code}`);
      }
    } catch (error) {
      console.error(error);
      await showAlert('Error', 'Error de red al intentar enviar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus al siguiente input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      await showAlert('Aviso', 'El código debe tener 6 dígitos.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: phone, codigoPais: countryCode, codigo: fullCode })
      });

      const data = await response.json();

      if (!response.ok) {
        await showAlert('Error', data.error || 'Código incorrecto o expirado.');
        return;
      }

      // Guardar token y actualizar contexto
      login(data.user, data.token);
      await showAlert('¡Éxito!', 'Sesión iniciada correctamente.');
      navigate('/'); // Redirigir al inicio o mis reservas
    } catch (error) {
      console.error(error);
      await showAlert('Error', 'Error de red al verificar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-col-center animate-fade-in login-container">
      <h2>{step === 1 ? 'Iniciar Sesión' : 'Verifica tu número'}</h2>
      <p className="text-center mb-2" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
        {step === 1 
          ? 'Ingresa tu número de WhatsApp para recibir un código de acceso rápido.' 
          : `Hemos enviado un código de 6 dígitos a ${countryCode} ${phone}`}
      </p>

      {step === 1 ? (
        <>
          <div className="country-selector">
            <select 
              className="country-select"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              <option value="+51">🇵🇪 +51 (Perú)</option>
              <option value="+54">🇦🇷 +54 (Argentina)</option>
              <option value="+56">🇨🇱 +56 (Chile)</option>
              <option value="+57">🇨🇴 +57 (Colombia)</option>
              <option value="+52">🇲🇽 +52 (México)</option>
              <option value="+1">🇺🇸 +1 (USA)</option>
            </select>
            <input 
              type="tel" 
              className="phone-input" 
              placeholder="987 654 321" 
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
              maxLength="15"
            />
          </div>
          <button 
            className="btn-primary mt-1" 
            onClick={handleSendCode}
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar Código'}
          </button>
        </>
      ) : (
        <>
          <div className="verification-code-container">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                className="code-digit"
                maxLength="1"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
              />
            ))}
          </div>
          <button 
            className="btn-primary mt-1" 
            onClick={handleVerifyCode}
            disabled={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Verificar e Ingresar'}
          </button>
          <button 
            className="btn-cancel-res mt-1" 
            onClick={() => setStep(1)}
            style={{ width: '100%', maxWidth: '320px', border: 'none', background: 'transparent' }}
          >
            Cambiar número
          </button>
        </>
      )}
    </div>
  );
};

export default Login;
