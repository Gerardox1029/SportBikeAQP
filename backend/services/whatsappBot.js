const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client = null;
let currentQR = null;
let ready = false;

const initWhatsApp = () => {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', async (qr) => {
    currentQR = await qrcode.toDataURL(qr);
    console.log('[WhatsApp] QR Code generado. Escanéalo desde el panel admin.');
    
    // Also print QR in terminal for convenience
    try {
      const qrcodeTerminal = require('qrcode-terminal');
      qrcodeTerminal.generate(qr, { small: true });
    } catch (e) {
      // qrcode-terminal not installed, skip
    }
  });

  client.on('ready', () => {
    ready = true;
    currentQR = null;
    console.log('[WhatsApp] ✅ Bot conectado exitosamente!');
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Autenticado correctamente');
  });

  client.on('auth_failure', (msg) => {
    ready = false;
    console.error('[WhatsApp] ❌ Error de autenticación:', msg);
  });

  client.on('disconnected', (reason) => {
    ready = false;
    currentQR = null;
    console.log('[WhatsApp] Desconectado:', reason);
    // Try to reconnect after 5 seconds
    setTimeout(() => {
      console.log('[WhatsApp] Intentando reconectar...');
      client.initialize().catch(console.error);
    }, 5000);
  });

  client.initialize().catch((err) => {
    console.error('[WhatsApp] Error inicializando:', err.message);
    console.log('[WhatsApp] El bot de WhatsApp no está disponible. La app seguirá funcionando sin él.');
  });

  return client;
};

const sendMessage = async (phone, message) => {
  if (!client || !ready) {
    throw new Error('WhatsApp client not ready');
  }
  
  // Format phone number: remove + and add @c.us
  const chatId = phone.replace('+', '') + '@c.us';
  
  try {
    await client.sendMessage(chatId, message);
    console.log(`[WhatsApp] Mensaje enviado a ${phone}`);
    return true;
  } catch (error) {
    console.error(`[WhatsApp] Error enviando mensaje a ${phone}:`, error.message);
    throw error;
  }
};

const getQR = () => currentQR;
const isReady = () => ready;
const getClient = () => client;

module.exports = { initWhatsApp, sendMessage, getQR, isReady, getClient };
