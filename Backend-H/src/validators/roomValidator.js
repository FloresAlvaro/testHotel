const Joi = require('joi');
const { id, date } = require('./common');
const status = Joi.string().valid('available', 'reserved', 'occupied', 'maintenance');
const fields = {
  number: Joi.string().trim().min(1).max(20),
  room_type_id: id,
  floor: Joi.number().integer().min(0).max(2147483647),
};
module.exports = {
  createSchema: Joi.object({
    ...fields,
    number: fields.number.required(),
    room_type_id: id.required(),
  }),
  updateSchema: Joi.object({ ...fields, status }).min(1),
  statusSchema: Joi.object({ status: status.required() }),
  availableSchema: Joi.object({
    checkIn: date.required(),
    checkOut: date.required(),
    roomTypeId: id,
  }).custom((v, h) => (v.checkIn < v.checkOut ? v : h.error('any.invalid'))),
};
