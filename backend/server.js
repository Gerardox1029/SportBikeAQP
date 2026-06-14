require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' })); // Permite CORS
app.use(express.json()); // Parsea JSON en el body

// Rutas
app.use('/api', apiRoutes);

// Manejo de errores global simple
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

// Conexión a MongoDB y arranque del servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB Exitosamente');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err.message);
    console.log('Iniciando servidor sin BD solo para desarrollo...');
    // Para probar UI sin BD
    app.listen(PORT, () => {
      console.log(`Servidor corriendo (SIN DB) en puerto ${PORT}`);
    });
  });
