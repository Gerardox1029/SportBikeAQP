const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const path = require('path');

const AUTH_DIR = path.join(__dirname, '../../auth_info');
const TIMEOUT_CONEXION_MS = 120000;

const logger = pino({ level: 'warn' });

let sock = null;
let currentQR = null;
let ready = false;
let resolversConexion = [];

const initWhatsApp = async () => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: false,
      getMessage: async () => ({ conversation: '' }),
    });

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        currentQR = await qrcode.toDataURL(qr);
        console.log('\n[WhatsApp] Escanea el QR para vincular tu cuenta:\n');
        qrcodeTerminal.generate(qr, { small: true });
      }

      if (connection === 'open') {
        console.log('[WhatsApp] ✓ Conexión establecida correctamente.');
        ready = true;
        currentQR = null;
        resolversConexion.forEach(({ resolve }) => resolve());
        resolversConexion = [];
      }

      if (connection === 'close') {
        ready = false;
        currentQR = null;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const debeReconectar = statusCode !== DisconnectReason.loggedOut;

        console.log(
          `[WhatsApp] Conexión cerrada. Código: ${statusCode ?? 'desconocido'}. ` +
          `Reconectar: ${debeReconectar}`
        );

        resolversConexion.forEach(({ reject }) =>
          reject(new Error(`Conexión cerrada con código ${statusCode}`))
        );
        resolversConexion = [];

        if (debeReconectar) {
          console.log('[WhatsApp] Reconectando en 5 segundos...');
          setTimeout(initWhatsApp, 5000);
        } else {
          console.error(
            '[WhatsApp] ✗ Sesión cerrada permanentemente. ' +
            'Elimina la carpeta auth_info/ y reinicia el servicio para vincular de nuevo.'
          );
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (error) {
    console.error('[WhatsApp] Error inicializando:', error.message);
  }
};

function esperarConexion() {
  if (ready) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout: WhatsApp no conectó en el tiempo esperado.'));
    }, TIMEOUT_CONEXION_MS);

    resolversConexion.push({
      resolve: () => { clearTimeout(timer); resolve(); },
      reject: (err) => { clearTimeout(timer); reject(err); },
    });
  });
}

const sendMessage = async (phone, message) => {
  await esperarConexion();

  if (!sock || !ready) {
    throw new Error('WhatsApp client not ready');
  }
  
  // Format phone number: remove +, spaces, dashes, parens
  const numeroLimpio = phone.replace(/[\s\-\+\(\)]/g, '');
  const jid = `${numeroLimpio}@s.whatsapp.net`;
  
  try {
    const resultado = await sock.sendMessage(jid, { text: message });
    console.log(`[WhatsApp] Mensaje enviado a ${phone}`);
    return resultado;
  } catch (error) {
    console.error(`[WhatsApp] Error enviando mensaje a ${phone}:`, error.message);
    throw error;
  }
};

const getQR = () => currentQR;
const isReady = () => ready;
const getClient = () => sock;

const logoutWhatsApp = async () => {
  if (sock) {
    try {
      await sock.logout();
    } catch(e) {
      console.error('[WhatsApp] Error logging out:', e.message);
    }
    sock = null;
    ready = false;
    currentQR = null;
  }
};

module.exports = { initWhatsApp, sendMessage, getQR, isReady, getClient, esperarConexion, logoutWhatsApp };
