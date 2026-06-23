const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const { authMiddleware, JWT_SECRET } = require('../middleware/authMiddleware');

// POST /api/auth/send-code — Generate and save verification code
router.post('/send-code', async (req, res) => {
  try {
    const { telefono, codigoPais, nombres, apellidos, dni } = req.body;
    if (!telefono || telefono.length < 9) {
      return res.status(400).json({ error: 'Número de teléfono inválido' });
    }

    const fullPhone = `${codigoPais || '+51'}${telefono}`;

    // Generate 6-digit code
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Find or create user by phone
    let user = await User.findOne({ telefono: fullPhone });
    if (!user) {
      // Create new user with full registration data + 10 welcome points
      user = new User({
        dni: dni || `TEL-${telefono.slice(-8)}`,
        nombre: nombres || 'Usuario',
        apellidos: apellidos || '',
        telefono: fullPhone,
        codigoPais: codigoPais || '+51',
        codigoVerificacion: codigo,
        puntos: 10
      });
    } else {
      user.codigoVerificacion = codigo;
      // Update name/apellidos if provided
      if (nombres) user.nombre = nombres;
      if (apellidos) user.apellidos = apellidos;
      if (dni) user.dni = dni;
    }

    await user.save();

    // Try to send code via WhatsApp if bot is available
    try {
      const { sendMessage, isReady } = require('../services/whatsappBot');
      if (isReady()) {
        await sendMessage(fullPhone, `🔐 Tu código de verificación SportBikeAQP es: *${codigo}*\n\nNo compartas este código con nadie.`);
        console.log(`[Auth] Código ${codigo} enviado por WhatsApp a ${fullPhone}`);
      } else {
        console.log(`[Auth] WhatsApp no disponible. Código para ${fullPhone}: ${codigo}`);
      }
    } catch (waError) {
      console.log(`[Auth] WhatsApp no disponible. Código para ${fullPhone}: ${codigo}`);
    }

    res.json({
      message: 'Código enviado',
      // In development, return the code (remove in production!)
      ...(process.env.NODE_ENV !== 'production' && { debug_code: codigo })
    });
  } catch (error) {
    console.error('[Auth] Error sending code:', error);
    res.status(500).json({ error: 'Error enviando código de verificación' });
  }
});

// POST /api/auth/admin-login — Login for Administrator
router.post('/admin-login', async (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === adminPassword) {
      const token = jwt.sign(
        { role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1d' }
      );
      res.json({ token, user: { role: 'admin', nombre: 'Administrador' } });
    } else {
      res.status(401).json({ error: 'Contraseña incorrecta' });
    }
  } catch (error) {
    console.error('[Auth] Error admin login:', error);
    res.status(500).json({ error: 'Error en login de administrador' });
  }
});

// POST /api/auth/verify-code — Verify code and return JWT
router.post('/verify-code', async (req, res) => {
  try {
    const { telefono, codigoPais, codigo } = req.body;
    const fullPhone = `${codigoPais || '+51'}${telefono}`;

    const user = await User.findOne({ telefono: fullPhone });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.codigoVerificacion !== codigo) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    // Mark as verified, clear code
    user.verificado = true;
    user.codigoVerificacion = null;
    await user.save();

    // Generate JWT (expires in 30 days)
    const token = jwt.sign(
      { userId: user._id, telefono: user.telefono, nombre: user.nombre },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Send welcome message to new users
    if (!user.verificado) {
      try {
        const { sendMessage, isReady } = require('../services/whatsappBot');
        if (isReady()) {
          await sendMessage(fullPhone, `🚴 ¡Bienvenido a SportBikeAQP! 🎉\n\nTu cuenta ha sido verificada exitosamente. Ya puedes hacer reservas y acumular puntos.\n\n📍 Encuéntranos en Google Maps:\nhttps://maps.app.goo.gl/8NWbvcTbDFPnerEd7`);
        }
      } catch (waError) {
        // WhatsApp not available, continue
      }
    }

    res.json({
      token,
      user: {
        _id: user._id,
        nombre: user.nombre,
        telefono: user.telefono,
        dni: user.dni,
        puntos: user.puntos
      }
    });
  } catch (error) {
    console.error('[Auth] Error verifying code:', error);
    res.status(500).json({ error: 'Error verificando código' });
  }
});








router.post('/verify-admin-password', (req, res) => {
  const { password } = req.body;

  // Verificación directa contra el .env del servidor
  if (password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ success: true, message: 'Acceso concedido' });
  }

  return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
});









// GET /api/auth/me — Get current user from JWT
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-codigoVerificacion');
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
});






// GET /api/auth/my-reservations — Get reservations for logged-in user
router.get('/my-reservations', authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.find({
      id_usuario: req.user.userId
    }).sort({ fecha: -1, hora_inicio: -1 });

    // Also find by phone-based name match as fallback
    const user = await User.findById(req.user.userId);
    let allReservations = reservations;

    if (user && reservations.length === 0) {
      // Fallback: find by nombre_temporal containing the user's name
      const nameReservations = await Reservation.find({
        nombre_temporal: { $regex: user.nombre, $options: 'i' }
      }).sort({ fecha: -1, hora_inicio: -1 });
      allReservations = nameReservations;
    }

    res.json(allReservations);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo reservas' });
  }
});

module.exports = router;
