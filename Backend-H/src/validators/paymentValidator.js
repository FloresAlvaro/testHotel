const Joi = require('joi');

const createSchema = Joi.object({
	reservation_id: Joi.number().integer().positive().required(),
	amount: Joi.number().positive().required(),
	type: Joi.string().valid('full', 'partial', 'advance'),
	method: Joi.string().valid('cash', 'credit_card', 'debit_card', 'transfer', 'check').required(),
	transaction_id: Joi.string().trim().max(100).allow('', null),
	notes: Joi.string().trim().max(2000).allow('', null)
});

const updateStatusSchema = Joi.object({
	status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').required()
});

module.exports = { createSchema, updateStatusSchema };
