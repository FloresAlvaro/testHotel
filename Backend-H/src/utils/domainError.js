const domainError = (message, statusCode = 409) => Object.assign(new Error(message), { statusCode });
module.exports = domainError;
