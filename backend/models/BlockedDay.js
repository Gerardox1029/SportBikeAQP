const mongoose = require('mongoose');

const blockedDaySchema = new mongoose.Schema({
  fecha: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('BlockedDay', blockedDaySchema);
