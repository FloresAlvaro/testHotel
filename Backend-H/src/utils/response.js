const { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../config/constants');

// ============================================
// FUNCIONES DE RESPUESTA EXITOSA
// ============================================

/**
 * Enviar respuesta exitosa genérica
 * @param {object} res - Objeto response de Express
 * @param {*} data - Datos a enviar
 * @param {number} statusCode - Código HTTP (default: 200)
 * @param {string} message - Mensaje de éxito
 */
const sendSuccess = (res, data = null, statusCode = HTTP_STATUS.OK, message = SUCCESS_MESSAGES.OPERATION_SUCCESS) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Enviar respuesta de creación exitosa
 * @param {object} res - Objeto response de Express
 * @param {*} data - Datos creados
 * @param {string} message - Mensaje personalizado
 */
const sendCreated = (res, data, message = SUCCESS_MESSAGES.CREATED_SUCCESS) => {
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Enviar respuesta actualizada exitosa
 * @param {object} res - Objeto response de Express
 * @param {*} data - Datos actualizados
 * @param {string} message - Mensaje personalizado
 */
const sendUpdated = (res, data, message = SUCCESS_MESSAGES.UPDATED_SUCCESS) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Enviar respuesta de eliminación exitosa
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje personalizado
 */
const sendDeleted = (res, message = SUCCESS_MESSAGES.DELETED_SUCCESS) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data: null,
    timestamp: new Date().toISOString()
  });
};

/**
 * Enviar respuesta con lista paginada
 * @param {object} res - Objeto response de Express
 * @param {array} data - Datos de la página
 * @param {number} total - Total de registros
 * @param {number} page - Página actual
 * @param {number} pageSize - Tamaño de página
 * @param {string} message - Mensaje personalizado
 */
const sendPaginated = (res, data, total, page = 1, pageSize = 10, message = SUCCESS_MESSAGES.OPERATION_SUCCESS) => {
  const totalPages = Math.ceil(total / pageSize);
  
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Enviar respuesta con múltiples objetos (sin paginación)
 * @param {object} res - Objeto response de Express
 * @param {object} data - Objeto con múltiples propiedades
 * @param {string} message - Mensaje personalizado
 */
const sendMultiple = (res, data, message = SUCCESS_MESSAGES.OPERATION_SUCCESS) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Enviar respuesta solo con mensaje (sin datos)
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje a enviar
 * @param {number} statusCode - Código HTTP
 */
const sendMessage = (res, message, statusCode = HTTP_STATUS.OK) => {
  res.status(statusCode).json({
    success: true,
    message,
    timestamp: new Date().toISOString()
  });
};

// ============================================
// FUNCIONES DE RESPUESTA DE ERROR
// ============================================

/**
 * Enviar respuesta de error genérica
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código HTTP (default: 400)
 * @param {*} errors - Errores adicionales (validaciones, etc)
 */
const sendError = (res, message = ERROR_MESSAGES.BAD_REQUEST, statusCode = HTTP_STATUS.BAD_REQUEST, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

/**
 * Enviar error 400 - Bad Request
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {*} errors - Errores de validación
 */
const sendBadRequest = (res, message = ERROR_MESSAGES.BAD_REQUEST, errors = null) => {
  sendError(res, message, HTTP_STATUS.BAD_REQUEST, errors);
};

/**
 * Enviar error 401 - Unauthorized
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 */
const sendUnauthorized = (res, message = ERROR_MESSAGES.UNAUTHORIZED) => {
  sendError(res, message, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Enviar error 403 - Forbidden
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 */
const sendForbidden = (res, message = ERROR_MESSAGES.FORBIDDEN) => {
  sendError(res, message, HTTP_STATUS.FORBIDDEN);
};

/**
 * Enviar error 404 - Not Found
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 */
const sendNotFound = (res, message = ERROR_MESSAGES.NOT_FOUND) => {
  sendError(res, message, HTTP_STATUS.NOT_FOUND);
};

/**
 * Enviar error 409 - Conflict
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 */
const sendConflict = (res, message = ERROR_MESSAGES.CONFLICT) => {
  sendError(res, message, HTTP_STATUS.CONFLICT);
};

/**
 * Enviar error 422 - Unprocessable Entity (Validación)
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 * @param {*} errors - Errores de validación
 */
const sendValidationError = (res, message = 'Errores de validación', errors = {}) => {
  sendError(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
};

/**
 * Enviar error 500 - Internal Server Error
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 */
const sendInternalError = (res, message = ERROR_MESSAGES.INTERNAL_ERROR) => {
  sendError(res, message, HTTP_STATUS.INTERNAL_ERROR);
};

/**
 * Enviar error 503 - Service Unavailable
 * @param {object} res - Objeto response de Express
 * @param {string} message - Mensaje de error
 */
const sendServiceUnavailable = (res, message = 'Servicio no disponible') => {
  sendError(res, message, HTTP_STATUS.SERVICE_UNAVAILABLE);
};

// ============================================
// FUNCIONES ESPECÍFICAS DEL HOTEL
// ============================================

/**
 * Respuesta para inicio de sesión
 * @param {object} res - Objeto response de Express
 * @param {object} user - Datos del usuario
 * @param {string} token - Token JWT
 */
const sendLoginSuccess = (res, user, token) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    data: {
      user,
      token,
      tokenType: 'Bearer'
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Respuesta para login fallido
 * @param {object} res - Objeto response de Express
 */
const sendLoginFailed = (res) => {
  sendError(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Respuesta para usuario no autenticado
 * @param {object} res - Objeto response de Express
 */
const sendNotAuthenticated = (res) => {
  sendError(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Respuesta para recurso no disponible
 * @param {object} res - Objeto response de Express
 * @param {string} resourceName - Nombre del recurso
 */
const sendResourceNotAvailable = (res, resourceName = 'Recurso') => {
  sendError(res, `${resourceName} no disponible para las fechas seleccionadas`, HTTP_STATUS.CONFLICT);
};

/**
 * Respuesta para operación de check-in exitosa
 * @param {object} res - Objeto response de Express
 * @param {object} checkInData - Datos del check-in
 */
const sendCheckInSuccess = (res, checkInData) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.CHECKIN_SUCCESS,
    data: checkInData,
    timestamp: new Date().toISOString()
  });
};

/**
 * Respuesta para operación de check-out exitosa
 * @param {object} res - Objeto response de Express
 * @param {object} checkOutData - Datos del check-out
 */
const sendCheckOutSuccess = (res, checkOutData) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.CHECKOUT_SUCCESS,
    data: checkOutData,
    timestamp: new Date().toISOString()
  });
};

/**
 * Respuesta para pago completado
 * @param {object} res - Objeto response de Express
 * @param {object} paymentData - Datos del pago
 */
const sendPaymentSuccess = (res, paymentData) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: SUCCESS_MESSAGES.PAYMENT_COMPLETED,
    data: paymentData,
    timestamp: new Date().toISOString()
  });
};

/**
 * Respuesta para reporte/exportación
 * @param {object} res - Objeto response de Express
 * @param {*} reportData - Datos del reporte
 * @param {string} reportName - Nombre del reporte
 */
const sendReport = (res, reportData, reportName = 'Reporte') => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${reportName} generado exitosamente`,
    report: {
      name: reportName,
      generatedAt: new Date().toISOString(),
      data: reportData
    }
  });
};

// ============================================
// FUNCIONES DE VALIDACIÓN Y ERRORES PERSONALIZADOS
// ============================================

/**
 * Validar y enviar errores de validación
 * @param {object} res - Objeto response de Express
 * @param {array} validationErrors - Errores de Joi/validador
 */
const sendValidationErrors = (res, validationErrors) => {
  const errors = {};
  
  validationErrors.forEach(error => {
    errors[error.path[0]] = error.message;
  });

  sendValidationError(res, 'Errores de validación en los datos', errors);
};

/**
 * Enviar múltiples errores
 * @param {object} res - Objeto response de Express
 * @param {object} errorObject - Objeto con errores por campo
 */
const sendFieldErrors = (res, errorObject) => {
  sendValidationError(res, 'Errores en los campos enviados', errorObject);
};

// ============================================
// FUNCIONES DE RESPUESTA EN TRANSACCIONES
// ============================================

/**
 * Respuesta para operación iniciada
 * @param {object} res - Objeto response de Express
 * @param {*} data - Datos de la operación
 */
const sendAccepted = (res, data) => {
  res.status(HTTP_STATUS.ACCEPTED).json({
    success: true,
    message: 'Operación aceptada y en proceso',
    data,
    timestamp: new Date().toISOString()
  });
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Obtener mensaje de error por código HTTP
 * @param {number} statusCode - Código HTTP
 * @returns {string} Mensaje correspondiente
 */
const getErrorMessageByStatus = (statusCode) => {
  const statusMessages = {
    400: ERROR_MESSAGES.BAD_REQUEST,
    401: ERROR_MESSAGES.UNAUTHORIZED,
    403: ERROR_MESSAGES.FORBIDDEN,
    404: ERROR_MESSAGES.NOT_FOUND,
    409: ERROR_MESSAGES.CONFLICT,
    422: 'Errores de validación',
    500: ERROR_MESSAGES.INTERNAL_ERROR,
    503: 'Servicio no disponible'
  };

  return statusMessages[statusCode] || ERROR_MESSAGES.INTERNAL_ERROR;
};

/**
 * Crear respuesta de error personalizada
 * @param {string} message - Mensaje
 * @param {number} statusCode - Código HTTP
 * @param {*} errors - Errores adicionales
 * @returns {object} Objeto de error
 */
const createErrorResponse = (message, statusCode = 400, errors = null) => {
  return {
    success: false,
    message,
    statusCode,
    ...(errors && { errors }),
    timestamp: new Date().toISOString()
  };
};

/**
 * Crear respuesta de éxito personalizada
 * @param {*} data - Datos
 * @param {string} message - Mensaje
 * @param {number} statusCode - Código HTTP
 * @returns {object} Objeto de respuesta
 */
const createSuccessResponse = (data = null, message = SUCCESS_MESSAGES.OPERATION_SUCCESS, statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode,
    timestamp: new Date().toISOString()
  };
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================

module.exports = {
  // Respuestas exitosas
  sendSuccess,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendPaginated,
  sendMultiple,
  sendMessage,

  // Respuestas de error
  sendError,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendValidationError,
  sendInternalError,
  sendServiceUnavailable,

  // Específicas del hotel
  sendLoginSuccess,
  sendLoginFailed,
  sendNotAuthenticated,
  sendResourceNotAvailable,
  sendCheckInSuccess,
  sendCheckOutSuccess,
  sendPaymentSuccess,
  sendReport,

  // Validación
  sendValidationErrors,
  sendFieldErrors,

  // Transacciones
  sendAccepted,

  // Utilidades
  getErrorMessageByStatus,
  createErrorResponse,
  createSuccessResponse
};