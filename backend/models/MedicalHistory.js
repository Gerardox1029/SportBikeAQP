const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
  id_usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  notas: {
    type: String,
    required: true,
    trim: true
  },
  creadoEn: {
    type: Date,
    default: Date.now
  }
});

medicalHistorySchema.index({ id_usuario: 1, fecha: -1 });

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);
