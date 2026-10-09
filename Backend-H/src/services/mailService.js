const nodemailer = require('nodemailer');
const details = require('../utils/errorDetails');
const { SMTP_PORT, SMTP_MAX_ATTEMPTS, SMTP_RETRY_DELAY_MS } = require('../config/environment');
const configured = () => Boolean(process.env.SMTP_HOST);
/** @param {string} email @param {string} link @param {'invite' | 'reset'} purpose */
const sendLink = async (email, link, purpose) => {
  if (!configured()) return false;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    ...(process.env.SMTP_USER && {
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    }),
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });
  const message = {
    from: process.env.SMTP_FROM || 'noreply@hotel.com',
    to: email,
    subject: purpose === 'invite' ? 'Invitación al equipo del hotel' : 'Restablecer contraseña',
    text: `Abre este enlace para ${purpose === 'invite' ? 'activar tu cuenta' : 'restablecer tu contraseña'}:\n${link}\nEl enlace es temporal y solo puede utilizarse una vez.`,
  };
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        await transport.sendMail(message);
        break;
      } catch (error) {
        const failure = details(error);
        // No repetir credenciales inválidas ni rechazos permanentes del destinatario.
        const transient =
          (failure.responseCode !== undefined &&
            failure.responseCode >= 400 &&
            failure.responseCode < 500) ||
          ['ETIMEDOUT', 'ECONNECTION', 'ECONNRESET', 'ESOCKET', 'EAI_AGAIN'].includes(
            failure.code || '',
          );
        if (!transient || attempt >= SMTP_MAX_ATTEMPTS) throw error;
        await new Promise((resolve) => setTimeout(resolve, SMTP_RETRY_DELAY_MS * attempt));
      }
    }
  } finally {
    transport.close();
  }
  return true;
};
module.exports = { configured, sendLink };
