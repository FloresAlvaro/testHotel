// ============================================
// CONSTANTES DEL SISTEMA HOTELERO
// ============================================

// ============================================
// ROLES DE USUARIO
// ============================================
const USER_ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  MANAGER: 'manager'
};

// ============================================
// ESTADOS DE HABITACIÓN
// ============================================
const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance',
  RESERVED: 'reserved'
};

// ============================================
// ESTADOS DE RESERVA
// ============================================
const RESERVATION_STATUS = {
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled'
};

// ============================================
// TIPOS DE PAGO
// ============================================
const PAYMENT_TYPES = {
  FULL: 'full',
  PARTIAL: 'partial',
  ADVANCE: 'advance'
};

// ============================================
// MÉTODOS DE PAGO
// ============================================
const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  TRANSFER: 'transfer',
  CHECK: 'check'
};

// ============================================
// ESTADOS DE PAGO
// ============================================
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// ============================================
// TIPOS DE DOCUMENTO
// ============================================
const DOCUMENT_TYPES = {
  CEDULA: 'cedula',
  PASSPORT: 'passport',
  LICENSE: 'license',
  OTHER: 'other'
};

// ============================================
// MENSAJES DE ERROR
// ============================================
const ERROR_MESSAGES = {
  // Generales
  INTERNAL_ERROR: 'Error interno del servidor',
  NOT_FOUND: 'Recurso no encontrado',
  UNAUTHORIZED: 'No autorizado',
  FORBIDDEN: 'Acceso denegado',
  BAD_REQUEST: 'Solicitud inválida',
  CONFLICT: 'El recurso ya existe',

  // Usuarios
  USER_NOT_FOUND: 'Usuario no encontrado',
  EMAIL_ALREADY_EXISTS: 'El email ya está registrado',
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
  INVALID_EMAIL: 'Email inválido',
  WEAK_PASSWORD: 'La contraseña debe tener al menos 8 caracteres',
  USER_INACTIVE: 'El usuario está inactivo',
  TOKEN_EXPIRED: 'El token ha expirado',
  INVALID_TOKEN: 'Token inválido',

  // Clientes
  CLIENT_NOT_FOUND: 'Cliente no encontrado',
  DOCUMENT_ALREADY_EXISTS: 'El documento ya está registrado',
  INVALID_DOCUMENT: 'Documento inválido',

  // Habitaciones
  ROOM_NOT_FOUND: 'Habitación no encontrada',
  ROOM_NOT_AVAILABLE: 'Habitación no disponible',
  ROOM_TYPE_NOT_FOUND: 'Tipo de habitación no encontrado',
  INVALID_ROOM_NUMBER: 'Número de habitación inválido',

  // Reservas
  RESERVATION_NOT_FOUND: 'Reserva no encontrada',
  INVALID_CHECK_IN_DATE: 'Fecha de check-in inválida',
  INVALID_CHECK_OUT_DATE: 'Fecha de check-out inválida',
  CHECK_IN_AFTER_CHECK_OUT: 'La fecha de check-in debe ser anterior a check-out',
  ROOM_NOT_AVAILABLE_FOR_DATES: 'La habitación no está disponible para esas fechas',
  RESERVATION_ALREADY_CHECKED_IN: 'La reserva ya tiene check-in registrado',
  RESERVATION_ALREADY_CHECKED_OUT: 'La reserva ya tiene check-out registrado',
  CANNOT_CANCEL_CHECKED_IN: 'No se puede cancelar una reserva con check-in activo',

  // Pagos
  PAYMENT_NOT_FOUND: 'Pago no encontrado',
  INSUFFICIENT_AMOUNT: 'Monto insuficiente',
  INVALID_PAYMENT_AMOUNT: 'Monto de pago inválido',
  INVALID_PAYMENT_METHOD: 'Método de pago inválido',

  // Check-in/Check-out
  CHECKIN_LOG_NOT_FOUND: 'Registro de check-in no encontrado',
  CHECKIN_ALREADY_EXISTS: 'Ya existe un check-in para esta reserva',
  CHECKOUT_ALREADY_RECORDED: 'El check-out ya ha sido registrado'
};

// ============================================
// MENSAJES DE ÉXITO
// ============================================
const SUCCESS_MESSAGES = {
  // Generales
  OPERATION_SUCCESS: 'Operación realizada exitosamente',
  CREATED_SUCCESS: 'Creado exitosamente',
  UPDATED_SUCCESS: 'Actualizado exitosamente',
  DELETED_SUCCESS: 'Eliminado exitosamente',

  // Usuarios
  USER_CREATED: 'Usuario creado exitosamente',
  USER_UPDATED: 'Usuario actualizado exitosamente',
  USER_DELETED: 'Usuario eliminado exitosamente',
  LOGIN_SUCCESS: 'Sesión iniciada correctamente',
  LOGOUT_SUCCESS: 'Sesión cerrada correctamente',

  // Clientes
  CLIENT_CREATED: 'Cliente registrado exitosamente',
  CLIENT_UPDATED: 'Datos del cliente actualizados',
  CLIENT_DELETED: 'Cliente eliminado',

  // Habitaciones
  ROOM_CREATED: 'Habitación creada exitosamente',
  ROOM_UPDATED: 'Habitación actualizada',
  ROOM_DELETED: 'Habitación eliminada',

  // Reservas
  RESERVATION_CREATED: 'Reserva creada exitosamente',
  RESERVATION_UPDATED: 'Reserva actualizada',
  RESERVATION_CANCELLED: 'Reserva cancelada',

  // Check-in/Check-out
  CHECKIN_SUCCESS: 'Check-in registrado exitosamente',
  CHECKOUT_SUCCESS: 'Check-out registrado exitosamente',

  // Pagos
  PAYMENT_CREATED: 'Pago registrado exitosamente',
  PAYMENT_UPDATED: 'Pago actualizado',
  PAYMENT_COMPLETED: 'Pago completado exitosamente'
};

// ============================================
// CÓDIGOS DE ESTADO HTTP
// ============================================
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// ============================================
// LÍMITES Y RESTRICCIONES
// ============================================
const LIMITS = {
  // Paginación
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Contraseña
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 255,

  // Strings
  MAX_NAME_LENGTH: 200,
  MAX_EMAIL_LENGTH: 200,
  MAX_PHONE_LENGTH: 20,
  MAX_DOCUMENT_LENGTH: 50,
  MAX_ADDRESS_LENGTH: 300,
  MAX_CITY_LENGTH: 100,
  MAX_COUNTRY_LENGTH: 100,

  // Moneda
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99,

  // Habitaciones
  MIN_CAPACITY: 1,
  MAX_CAPACITY: 10,
  MIN_FLOOR: 0,
  MAX_FLOOR: 50,

  // Reservas
  MIN_STAY_DAYS: 1,
  MAX_STAY_DAYS: 365,

  // Rate limiting
  API_RATE_LIMIT: 100, // requests
  API_RATE_WINDOW_MS: 15 * 60 * 1000 // 15 minutos
};

// ============================================
// CONFIGURACIÓN DE AUTENTICACIÓN
// ============================================
const AUTH_CONFIG = {
  JWT_ALGORITHM: 'HS256',
  TOKEN_TYPE: 'Bearer',
  REFRESH_TOKEN_DAYS: 7,
  PASSWORD_SALT_ROUNDS: 10
};

// ============================================
// ACCIONES DE AUDITORÍA
// ============================================
const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CHECKIN: 'CHECKIN',
  CHECKOUT: 'CHECKOUT',
  PAYMENT: 'PAYMENT',
  CANCEL: 'CANCEL'
};

// ============================================
// TABLA DE BASES DE DATOS
// ============================================
const TABLES = {
  USERS: 'user',
  CLIENTS: 'client',
  ROOMS: 'room',
  ROOM_TYPES: 'room_type',
  RESERVATIONS: 'reservation',
  CHECK_IN_LOG: 'check_in_log',
  PAYMENTS: 'payment',
  AUDIT_LOG: 'audit_log'
};

// ============================================
// VISTAS DE BASES DE DATOS
// ============================================
const VIEWS = {
  ACTIVE_RESERVATIONS: 'active_reservations',
  AVAILABLE_ROOMS: 'available_rooms',
  CURRENT_OCCUPANCY: 'current_occupancy',
  MONTHLY_REVENUE: 'monthly_revenue',
  GUEST_CHECKIN_HISTORY: 'guest_checkin_history',
  RECEPTIONIST_ACTIVITY: 'receptionist_activity'
};

// ============================================
// EMAILS (si implementas envío de emails)
// ============================================
const EMAIL_SUBJECTS = {
  RESERVATION_CONFIRMATION: 'Confirmación de Reserva',
  RESERVATION_CANCELLED: 'Reserva Cancelada',
  PAYMENT_RECEIVED: 'Pago Recibido',
  WELCOME: 'Bienvenido al Hotel',
  PASSWORD_RESET: 'Resetear Contraseña'
};

// ============================================
// FECHAS Y HORAS
// ============================================
const DATE_TIME = {
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  TIMEZONE: 'America/La_Paz',
  CHECK_IN_TIME: '14:00', // 2:00 PM
  CHECK_OUT_TIME: '11:00'  // 11:00 AM
};

// ============================================
// GÉNEROS
// ============================================
const GENDERS = {
  MALE: 'M',
  FEMALE: 'F',
  OTHER: 'O'
};

// ============================================
// VALIDACIONES CON REGEX
// ============================================
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+|0)\d{9,}$/,
  DOCUMENT: /^\d{5,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
};

// ============================================
// CONFIGURACIÓN DE REPORTES
// ============================================
const REPORT_CONFIG = {
  MAX_ROWS_EXCEL: 10000,
  MAX_ROWS_CSV: 50000,
  DATE_FORMAT_REPORT: 'DD/MM/YYYY'
};

// ============================================
// VALORES POR DEFECTO
// ============================================
const DEFAULTS = {
  CURRENCY: 'BOB', // Bolivianos
  LANGUAGE: 'es',
  TIMEZONE: 'America/La_Paz',
  ITEMS_PER_PAGE: 15,
  SORT_BY: 'created_at',
  SORT_ORDER: 'DESC'
};

// ============================================
// EXPORTAR TODAS LAS CONSTANTES
// ============================================
module.exports = {
  USER_ROLES,
  ROOM_STATUS,
  RESERVATION_STATUS,
  PAYMENT_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  DOCUMENT_TYPES,
  GENDERS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  HTTP_STATUS,
  LIMITS,
  AUTH_CONFIG,
  AUDIT_ACTIONS,
  TABLES,
  VIEWS,
  EMAIL_SUBJECTS,
  DATE_TIME,
  REGEX_PATTERNS,
  REPORT_CONFIG,
  DEFAULTS
};