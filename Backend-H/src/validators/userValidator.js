const Joi = require('joi');

const password = Joi.string().min(8).max(128).required();

const registerSchema = Joi.object({
	name: Joi.string().trim().min(2).max(200).required(),
	email: Joi.string().trim().email().max(200).required(),
	password
});

const loginSchema = Joi.object({
	email: Joi.string().trim().email().max(200).required(),
	password
});

const updateSchema = Joi.object({
	name: Joi.string().trim().min(2).max(200),
	email: Joi.string().trim().email().max(200),
	role: Joi.string().valid('admin', 'receptionist', 'manager'),
	is_active: Joi.boolean()
}).min(1);

const changePasswordSchema = Joi.object({
	currentPassword: password,
	newPassword: password,
	confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required()
		.messages({ 'any.only': 'Las contraseñas no coinciden' })
});

module.exports = {
	registerSchema,
	loginSchema,
	updateSchema,
	changePasswordSchema
};
