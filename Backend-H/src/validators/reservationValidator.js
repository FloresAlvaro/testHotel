const Joi = require('joi');

const dates = {
	check_in: Joi.date().iso().required(),
	check_out: Joi.date().iso().greater(Joi.ref('check_in')).required()
};

const createSchema = Joi.object({
	...dates,
	client_id: Joi.number().integer().positive().required(),
	room_id: Joi.number().integer().positive().required(),
	notes: Joi.string().trim().max(2000).allow('', null)
});

const updateSchema = Joi.object({
	...dates,
	total_price: Joi.number().min(0),
	status: Joi.string().valid('confirmed', 'checked_in', 'checked_out', 'cancelled'),
	notes: Joi.string().trim().max(2000).allow('', null)
}).min(1);

module.exports = { createSchema, updateSchema };
