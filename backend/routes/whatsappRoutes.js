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

module.exports = router;
