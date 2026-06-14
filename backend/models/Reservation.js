const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  id_usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  nombre_temporal: {
    type: String,
    required: true,
    trim: true
  },
  servicio: {
    type: String,
    required: true
  },
  fecha: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  hora_inicio: {
    type: String, // Format: HH:mm (e.g., 09:00)
    required: true
  },
  hora_fin: {
    type: String, // Format: HH:mm
    required: true
  },
  duracion_minutos: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Reservation', reservationSchema);
