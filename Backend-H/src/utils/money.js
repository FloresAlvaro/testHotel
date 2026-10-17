const businessError = require('./businessError');

// PostgreSQL DECIMAL(10,2): comparar centavos evita errores de coma flotante.
const cents = (value) => {
  const text = String(value);
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(text)) {
    throw businessError('Importe inválido: usa hasta dos decimales', 400);
  }
  const [whole, fraction = ''] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
};
module.exports = { cents };
