/** @param {unknown} value */
module.exports = (value) => {
  const error = value instanceof Error ? value : new Error('Error desconocido');
  return {
    message: error.message,
    code: 'code' in error ? String(error.code) : undefined,
    severity: 'severity' in error ? String(error.severity) : undefined,
    responseCode:
      'responseCode' in error && typeof error.responseCode === 'number'
        ? error.responseCode
        : undefined,
  };
};
