const errorHandler = (err, req, res, next) => {
  const databaseErrors = {
    '23505': [409, 'El registro ya existe'],
    '23503': [409, 'La operación afecta registros relacionados'],
    '23P01': [409, 'La habitación ya tiene una reserva para esas fechas'],
    '23502': [400, 'Faltan campos requeridos'],
    '23514': [400, 'Los datos incumplen las reglas del registro'],
    '22P02': [400, 'Formato de datos inválido'],
    '22007': [400, 'Fecha inválida'],
    '22008': [400, 'Fecha fuera de rango'],
    '22003': [400, 'Valor numérico fuera de rango']
  };
  const mapped = databaseErrors[err.code];
  const candidate = mapped?.[0] || err.statusCode || err.status || 500;
  const statusCode = Number.isInteger(candidate) && candidate >= 400 && candidate <= 599 ? candidate : 500;
  const message = mapped?.[1] || (statusCode >= 500 ? 'Error interno del servidor' : err.message);
  if (statusCode >= 500) console.error('Error interno:', { code: err.code, statusCode });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err })
  });
};

module.exports = errorHandler;
