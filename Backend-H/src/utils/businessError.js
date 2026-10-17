module.exports = (message, statusCode = 409) => Object.assign(new Error(message), { statusCode });
