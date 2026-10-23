const Joi = require('joi');

// bcrypt limita la entrada por bytes UTF-8, no por caracteres.
module.exports = Joi.string().min(8).max(72, 'utf8').required()
  .messages({ 'string.max': 'La contraseña no puede superar 72 bytes UTF-8' });
