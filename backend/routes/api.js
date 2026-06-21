const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const BlockedDay = require('../models/BlockedDay');

// --- USER ROUTES ---

// Register new client points
router.post('/users', async (req, res) => {
  try {
    const { dni, nombre } = req.body;
    // Check if DNI already exists
    const existingUser = await User.findOne({ dni });
    if (existingUser) {
      return res.status(400).json({ error: 'El DNI ya está registrado.' });
    }
    
    const newUser = new User({
      dni,
      nombre,
      puntos: 10 // Welcome points
    });
    
    await newUser.save();
    console.log(`[Registro Puntos] Nuevo usuario registrado exitosamente: ${nombre} (DNI: ${dni})`);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Error registrando usuario.' });
  }
});

// Search user by DNI
router.get('/users/search', async (req, res) => {
  try {
    const { dni } = req.query;
    if (!dni) return res.status(400).json({ error: 'DNI requerido' });
    
    const user = await User.findOne({ dni });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error buscando usuario.' });
  }
});

// Search users (Admin)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ fechaRegistro: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuarios.' });
  }
});

// Update points (Acumular o Canjear)
router.put('/users/:id/points', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, amount } = req.body; // action: 'add' or 'use'
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    if (action === 'use') {
      // Use all points
      user.puntos = 0;
    } else if (action === 'add') {
      user.puntos += amount;
      
      // Send WhatsApp notification
      if (user.telefono) {
        try {
          const { sendMessage, isReady } = require('../services/whatsappBot');
          if (isReady()) {
            await sendMessage(user.telefono, `🎉 ¡Excelente! Se le bonificaron *+${amount} puntos*.\n\n🏆 Total acumulados: *${user.puntos} puntos*.\n\nSigue acumulando para obtener grandes descuentos en SportBikeAQP 🚴.`);
          }
        } catch (waError) {
          console.error('[Points] Error enviando notificación de puntos:', waError.message);
        }
      }
    }
    
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando puntos.' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando usuario.' });
  }
});

// Add history to user
router.post('/users/:id/historial', async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, nota } = req.body;
    
    if (!fecha || !nota) return res.status(400).json({ error: 'Fecha y nota son requeridas.' });
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    user.historial = user.historial || [];
    user.historial.push({ fecha, nota });
    
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error agregando al historial.' });
  }
});

// --- RESERVATION ROUTES ---

// Create reservation
router.post('/reservations', async (req, res) => {
  try {
    const { id_usuario, nombre_temporal, servicio, fecha, hora_inicio, hora_fin, duracion_minutos } = req.body;
    
    // Check for overlapping reservations
    const overlapping = await Reservation.findOne({
      fecha,
      $or: [
        { hora_inicio: { $lt: hora_fin }, hora_fin: { $gt: hora_inicio } }
      ]
    });
    
    if (overlapping) {
      return res.status(400).json({ error: 'El horario seleccionado ya está reservado o se cruza con otra reserva.' });
    }
    
    const newReservation = new Reservation({
      id_usuario: id_usuario || null,
      nombre_temporal,
      servicio,
      fecha,
      hora_inicio,
      hora_fin,
      duracion_minutos
    });
    
    await newReservation.save();
    console.log(`[Reserva] Nueva reserva creada para ${nombre_temporal} el ${fecha} de ${hora_inicio} a ${hora_fin}`);
    
    // Add points and send message
    if (id_usuario) {
      const user = await User.findById(id_usuario);
      if (user) {
        user.puntos += 10;
        await user.save();
        
        if (user.telefono) {
          try {
            const { sendMessage, isReady } = require('../services/whatsappBot');
            if (isReady()) {
              const msg = `✅ *¡Reserva Confirmada!*\n\nHola ${user.nombre},\nTu reserva para *${servicio}* ha sido programada con éxito.\n\n📅 *Fecha:* ${fecha}\n⏰ *Hora:* ${hora_inicio}\n📍 *Lugar:* Local SportBikeAQP\n\n🎉 _Bienvenido a SportBikeAQP, lo bonificamos con +10 puntos._`;
              await sendMessage(user.telefono, msg);
            }
          } catch(e) {
            console.error('[Reserva] Error enviando mensaje post-reserva:', e.message);
          }
        }
      }
    }

    res.status(201).json(newReservation);
  } catch (error) {
    res.status(500).json({ error: 'Error creando reserva.' });
  }
});

// Get reservations (can filter by date)
router.get('/reservations', async (req, res) => {
  try {
    const { fecha } = req.query;
    let query = {};
    if (fecha) query.fecha = fecha;
    
    const reservations = await Reservation.find(query).sort({ fecha: 1, hora_inicio: 1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo reservas.' });
  }
});

// Get reservation counts between two dates
router.get('/reservations/counts', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      fecha: { $gte: startDate, $lte: endDate }
    };
    const reservations = await Reservation.find(query);
    
    const counts = {};
    reservations.forEach(r => {
      counts[r.fecha] = (counts[r.fecha] || 0) + 1;
    });
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo conteos.' });
  }
});

// Delete reservation
router.delete('/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Reservation.findByIdAndDelete(id);
    res.json({ message: 'Reserva eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando reserva.' });
  }
});

// Edit reservation
router.put('/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, hora_inicio, hora_fin, duracion_minutos } = req.body;
    const updated = await Reservation.findByIdAndUpdate(id, {
      fecha, hora_inicio, hora_fin, duracion_minutos
    }, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error editando reserva.' });
  }
});

// --- BLOCKED DAYS ROUTES ---

// Get blocked days between dates
router.get('/blocked-days', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      fecha: { $gte: startDate, $lte: endDate }
    };
    const blockedDays = await BlockedDay.find(query);
    res.json(blockedDays);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo días bloqueados.' });
  }
});

// Block a day
router.post('/blocked-days', async (req, res) => {
  try {
    const { fecha } = req.body;
    const newBlocked = new BlockedDay({ fecha });
    await newBlocked.save();
    res.status(201).json(newBlocked);
  } catch (error) {
    res.status(500).json({ error: 'Error bloqueando día.' });
  }
});

// Unblock a day
router.delete('/blocked-days/:fecha', async (req, res) => {
  try {
    const { fecha } = req.params;
    await BlockedDay.findOneAndDelete({ fecha });
    res.json({ message: 'Día desbloqueado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error desbloqueando día.' });
  }
});

module.exports = router;
