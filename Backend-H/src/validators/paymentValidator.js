const Joi = require('joi');

const createSchema = Joi.object({
	reservation_id: Joi.number().integer().positive().required(),
	amount: Joi.number().positive().max(99999999.99).precision(2).required(),
	type: Joi.string().valid('full', 'partial', 'advance'),
	method: Joi.string().valid('cash', 'credit_card', 'debit_card', 'transfer', 'check').required(),
	transaction_id: Joi.string().trim().max(100).allow('', null),
	notes: Joi.string().trim().max(2000).allow('', null)
});

const updateStatusSchema = Joi.object({
	status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').required()
});

const updateSchema = Joi.object({
	amount: Joi.number().positive(),
	type: Joi.string().valid('full', 'partial', 'advance'),
	method: Joi.string().valid('cash', 'credit_card', 'debit_card', 'transfer', 'check'),
	transaction_id: Joi.string().trim().max(100).allow('', null)
}).min(1);

module.exports = { createSchema, updateSchema, updateStatusSchema };
