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
  fechaRegistro: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
