const { sendValidationErrors } = require('../utils/response');

const validate = (schema, property = 'body') => {
	return (req, res, next) => {
		const { error, value } = schema.validate(req[property], {
			abortEarly: false,
			convert: true,
			allowUnknown: false
		});

		if (error) {
			return sendValidationErrors(res, error.details);
		}

		req[property] = value;
		next();
	};
};

module.exports = validate;
