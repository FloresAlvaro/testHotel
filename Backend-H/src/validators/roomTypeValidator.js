const Joi = require('joi');
const fields = {
  name: Joi.string().trim().min(1).max(200), description: Joi.string().max(10000).allow('', null),
  price: Joi.number().positive().max(99999999.99).precision(2),
  capacity: Joi.number().integer().positive().max(2147483647),
  amenities: Joi.string().max(500).allow('', null), image: Joi.string().max(500).allow('', null)
};
module.exports = {
  createSchema: Joi.object({ ...fields, name: fields.name.required(), price: fields.price.required(), capacity: fields.capacity.required() }),
  updateSchema: Joi.object(fields).min(1)
};
