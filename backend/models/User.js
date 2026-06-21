const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  dni: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellidos: {
    type: String,
    trim: true,
    default: ''
  },
  telefono: {
    type: String,
    trim: true,
    default: ''
  },
  codigoPais: {
    type: String,
    default: '+51'
  },
  codigoVerificacion: {
    type: String,
    default: null
  },
  verificado: {
    type: Boolean,
    default: false
  },
  puntos: {
    type: Number,
    default: 0
  },
  historial: [{
    fecha: { type: String },
    nota: { type: String }
  }],
  fechaRegistro: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
