require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const whatsappRoutes = require('./routes/whatsappRoutes');
const { initWhatsApp } = require('./services/whatsappBot');
const { initCronJobs } = require('./services/cronJobs');

// Build Trigger: Deploying JWT & WhatsApp authentication modules
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' })); // Permite CORS
app.use(express.json()); // Parsea JSON en el body

// Initialize WhatsApp Bot
let whatsappBot;
try {
  whatsappBot = {
    sendMessage: require('./services/whatsappBot').sendMessage,
    isReady: require('./services/whatsappBot').isReady
  };
  initWhatsApp();
} catch (error) {
  console.error('[System] Error al inicializar WhatsApp bot:', error);
}

// Initialize Cron Jobs
initCronJobs(whatsappBot);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api', apiRoutes);

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'public')));

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


// 1. Indicarle a Express dónde están los archivos estáticos (CSS, JS, imágenes) del Frontend
// En entornos de producción con Docker, la carpeta 'dist' del frontend suele copiarse al lado del servidor (en este caso, 'public' como dice el Dockerfile)
app.use(express.static(path.join(__dirname, 'public')));

// 2. LA SOLUCIÓN AL ERROR ANTERIOR: Capturar cualquier ruta del navegador usando RegEx pura
app.get(/^\/(.*)$/, (req, res) => {
  // Esto le dice a Express: "Si alguien pide cualquier página, respóndele con el index.html del Frontend"
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});