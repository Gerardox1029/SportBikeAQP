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
