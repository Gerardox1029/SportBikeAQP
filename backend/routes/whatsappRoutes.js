const express = require('express');
const router = express.Router();
const { getQR, isReady } = require('../services/whatsappBot');

// GET /api/whatsapp/qr — Get current QR code as base64
router.get('/qr', (req, res) => {
  const qr = getQR();
  if (qr) {
    res.json({ qr, status: 'waiting_scan' });
  } else if (isReady()) {
    res.json({ qr: null, status: 'connected' });
  } else {
    res.json({ qr: null, status: 'initializing' });
  }
});

// GET /api/whatsapp/status — Get bot connection status
router.get('/status', (req, res) => {
  res.json({
    connected: isReady(),
    hasQR: !!getQR(),
    status: isReady() ? 'connected' : (getQR() ? 'waiting_scan' : 'initializing')
  });
});

// POST /api/whatsapp/broadcast — Send mass message with 3s delay
router.post('/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensaje requerido' });
    
    if (!isReady()) return res.status(503).json({ error: 'WhatsApp no está conectado' });
    
    const User = require('../models/User');
    const { sendMessage } = require('../services/whatsappBot');
    const users = await User.find({ telefono: { $exists: true, $ne: null } });
    
    // Background broadcast task to prevent blocking the request
    (async () => {
      console.log(`[Broadcast] Iniciando envío a ${users.length} usuarios...`);
      for (const user of users) {
        if (user.telefono) {
          try {
            await sendMessage(user.telefono, message);
            console.log(`[Broadcast] Enviado a ${user.telefono}`);
          } catch (e) {
            console.error(`[Broadcast] Error enviando a ${user.telefono}:`, e.message);
          }
          // 15 second delay to prevent bans
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }
      console.log(`[Broadcast] Finalizado.`);
    })();
    
    res.json({ message: `Broadcast iniciado para ${users.length} usuarios.` });
  } catch (error) {
    console.error('[WhatsApp] Broadcast error:', error);
    res.status(500).json({ error: 'Error iniciando broadcast' });
  }
});

// POST /api/whatsapp/disconnect
router.post('/disconnect', async (req, res) => {
  try {
    const { logoutWhatsApp } = require('../services/whatsappBot');
    await logoutWhatsApp();
    res.json({ message: 'WhatsApp desvinculado correctamente' });
  } catch (error) {
    console.error('[WhatsApp] Disconnect error:', error);
    res.status(500).json({ error: 'Error al desvincular WhatsApp' });
  }
});

module.exports = router;
