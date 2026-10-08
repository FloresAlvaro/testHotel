const Joi = require('joi');
const { date, id } = require('./common');

const dates = {
	check_in: date.required(),
	check_out: date.required()
};

const orderedDates = (v, h) => !v.check_in || !v.check_out || v.check_in < v.check_out ? v : h.error('any.invalid');

const createSchema = Joi.object({
	...dates,
	client_id: id.required(),
	room_id: id.required(),
	notes: Joi.string().trim().max(2000).allow('', null)
}).custom(orderedDates);

const updateSchema = Joi.object({
	check_in: date,
	check_out: date,
	total_price: Joi.number().min(0).max(99999999.99).precision(2),
	status: Joi.string().valid('confirmed', 'checked_in', 'checked_out', 'cancelled'),
	notes: Joi.string().trim().max(2000).allow('', null)
}).min(1).custom(orderedDates);

module.exports = { createSchema, updateSchema };
