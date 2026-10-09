const Joi = require('joi');
const password = Joi.string()
  .min(8)
  .max(128)
  .custom((v, h) => (Buffer.byteLength(v, 'utf8') <= 72 ? v : h.error('any.invalid')));
const email = Joi.string().trim().lowercase().email().max(200).required();
const inviteSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  email,
  role: Joi.string().valid('admin', 'manager', 'receptionist').default('receptionist'),
});
const consumeSchema = Joi.object({
  token: Joi.string().hex().length(64).required(),
  password: password.required(),
  confirmPassword: Joi.valid(Joi.ref('password')).required(),
});
const resetSchema = Joi.object({ email });
module.exports = { inviteSchema, consumeSchema, resetSchema };
