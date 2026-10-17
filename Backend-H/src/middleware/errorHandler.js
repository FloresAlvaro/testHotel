const errorHandler = (err, req, res, next) => {
  if (err.code === 'P0001') err.statusCode = 409;
  if (err.code === '23505') err = Object.assign(new Error('El registro ya existe o la operación ya fue realizada'), { statusCode: 409 });
  if (err.code === '23P01') {
    err = Object.assign(new Error('Habitación no disponible para las fechas seleccionadas'), { statusCode: 409 });
  }
  console.error(err);

  const requestedStatus = err.statusCode || err.status;
  const statusCode = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
    ? requestedStatus : 500;
  const message = statusCode >= 500 && process.env.NODE_ENV !== 'development'
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err })
  });
};

module.exports = errorHandler;