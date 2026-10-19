const Joi = require('joi');
const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((value, helpers) => {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : helpers.error('any.invalid');
});
const methods = ['cash', 'credit_card', 'debit_card', 'transfer', 'check'];
const schema = (statuses = []) => Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
  q: Joi.string().trim().max(200).allow(''),
  status: Joi.string().valid(...statuses).allow(''),
  method: Joi.string().valid(...methods).allow(''),
  startDate: date, endDate: date,
  role: Joi.string().valid('admin','manager','receptionist'),
  clientId: Joi.number().integer().positive(),
}).custom((value, helpers) => value.startDate && value.endDate && value.startDate > value.endDate ? helpers.error('any.invalid') : value);
module.exports = { schema, methods };
