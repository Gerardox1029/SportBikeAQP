const cron = require('node-cron');
const Reservation = require('../models/Reservation');
const User = require('../models/User');

const initCronJobs = (whatsappBot) => {
  // Daily reminder at 7:00 AM Peru time (UTC-5 = 12:00 UTC)
  cron.schedule('0 12 * * *', async () => {
    console.log('[Cron] Ejecutando recordatorio diario de reservas (7:00 AM Perú)...');
    
    try {
      const today = new Date();
      // Format to YYYY-MM-DD in Peru timezone
      const peruDate = new Date(today.getTime() - (5 * 60 * 60 * 1000));
      const todayStr = peruDate.toISOString().split('T')[0];
      
      // Find all reservations for today
      const reservations = await Reservation.find({ fecha: todayStr });
      
      if (reservations.length === 0) {
        console.log('[Cron] No hay reservas para hoy.');
        return;
      }

      console.log(`[Cron] ${reservations.length} reservas encontradas para ${todayStr}`);

      const { sendMessage, isReady } = whatsappBot;
      
      if (!isReady()) {
        console.log('[Cron] WhatsApp no está conectado. No se pueden enviar recordatorios.');
        return;
      }

      for (const reservation of reservations) {
        // Try to find the user's phone
        let phone = null;

        if (reservation.id_usuario) {
          const user = await User.findById(reservation.id_usuario);
          if (user && user.telefono) {
            phone = user.telefono;
          }
        }

        if (phone) {
          const message = `🔔 *Recordatorio de Reserva - SportBikeAQP*\n\n` +
            `Hola ${reservation.nombre_temporal} 👋\n\n` +
            `Te recordamos que hoy tienes una reserva:\n` +
            `🔧 *Servicio:* ${reservation.servicio}\n` +
            `🕐 *Hora:* ${reservation.hora_inicio} - ${reservation.hora_fin}\n` +
            `⏱️ *Duración:* ${reservation.duracion_minutos} minutos\n\n` +
            `📍 Ubicación: https://maps.app.goo.gl/8NWbvcTbDFPnerEd7\n\n` +
            `¡Te esperamos! 🚴`;

          try {
            await sendMessage(phone, message);
            console.log(`[Cron] Recordatorio enviado a ${reservation.nombre_temporal} (${phone})`);
          } catch (error) {
            console.error(`[Cron] Error enviando recordatorio a ${phone}:`, error.message);
          }

          // Small delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log(`[Cron] No se encontró teléfono para ${reservation.nombre_temporal}`);
        }
      }

      console.log('[Cron] Recordatorios completados.');
    } catch (error) {
      console.error('[Cron] Error en recordatorio diario:', error);
    }
  }, {
    timezone: 'America/Lima'
  });

  console.log('[Cron] ⏰ Job programado: Recordatorio diario a las 7:00 AM (Perú)');
};

module.exports = { initCronJobs };
