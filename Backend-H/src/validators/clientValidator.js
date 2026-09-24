const Joi = require('joi');

const clientFields = {
	name: Joi.string().trim().min(2).max(200).required(),
	document: Joi.string().trim().min(3).max(50).required(),
	document_type: Joi.string().valid('cedula', 'passport', 'license', 'other'),
	email: Joi.string().trim().email().max(200).allow('', null),
	phone: Joi.string().trim().max(20).allow('', null),
	address: Joi.string().trim().max(300).allow('', null),
	city: Joi.string().trim().max(100).allow('', null),
	country: Joi.string().trim().max(100).allow('', null),
	nationality: Joi.string().trim().max(100).allow('', null),
	date_of_birth: Joi.date().iso().allow(null),
	gender: Joi.string().valid('M', 'F').allow(null),
	emergency_contact: Joi.string().trim().max(200).allow('', null),
	emergency_phone: Joi.string().trim().max(20).allow('', null)
};

const createSchema = Joi.object(clientFields);
const updateSchema = Joi.object({
	name: clientFields.name,
	email: clientFields.email,
	phone: clientFields.phone,
	address: clientFields.address,
	city: clientFields.city,
	country: clientFields.country,
	emergency_contact: clientFields.emergency_contact,
	emergency_phone: clientFields.emergency_phone
}).fork(['name'], field => field.optional()).min(1);

module.exports = { createSchema, updateSchema };
