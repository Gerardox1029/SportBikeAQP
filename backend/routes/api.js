const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Reservation = require('../models/Reservation');

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

module.exports = router;
