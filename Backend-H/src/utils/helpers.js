const { DEFAULTS, DATE_TIME } = require('../config/constants');

// ============================================
// FUNCIONES DE FORMATEO
// ============================================

/**
 * Formatear moneda a formato de moneda local
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (ej: BOB, USD)
 * @returns {string} Cantidad formateada
 */
const formatCurrency = (amount, currency = DEFAULTS.CURRENCY) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formatear fecha a formato local
 * @param {Date|string} date - Fecha a formatear
 * @param {string} format - Formato deseado
 * @returns {string} Fecha formateada
 */
const formatDate = (date, format = 'DD/MM/YYYY') => {
  const d = new Date(date);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (format === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }
  
  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  
  return d.toLocaleDateString('es-BO');
};

/**
 * Formatear fecha y hora
 * @param {Date|string} datetime - Fecha y hora
 * @returns {string} Formateado como DD/MM/YYYY HH:mm:ss
 */
const formatDateTime = (datetime) => {
  const d = new Date(datetime);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

/**
 * Formatear string a minúsculas y sin espacios
 * @param {string} str - String a formatear
 * @returns {string} String formateado
 */
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Capitalizar primera letra de cada palabra
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
const capitalize = (str) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Truncar texto a longitud específica
 * @param {string} text - Texto a truncar
 * @param {number} length - Longitud máxima
 * @returns {string} Texto truncado
 */
const truncate = (text, length = 100) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Validar formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validar documento
 * @param {string} document - Documento a validar
 * @returns {boolean} True si es válido
 */
const isValidDocument = (document) => {
  return /^\d{5,}$/.test(document);
};

/**
 * Validar teléfono
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} True si es válido
 */
const isValidPhone = (phone) => {
  return /^(\+|0)\d{7,}$/.test(phone);
};

/**
 * Validar URL
 * @param {string} url - URL a validar
 * @returns {boolean} True si es válida
 */
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validar contraseña (al menos 8 caracteres, mayúscula, minúscula, número)
 * @param {string} password - Contraseña a validar
 * @returns {object} { valid: boolean, errors: string[] }
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================
// FUNCIONES DE FECHAS
// ============================================

/**
 * Calcular número de noches entre dos fechas
 * @param {Date|string} checkIn - Fecha de entrada
 * @param {Date|string} checkOut - Fecha de salida
 * @returns {number} Número de noches
 */
const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calcular precio total de reserva
 * @param {number} pricePerNight - Precio por noche
 * @param {Date|string} checkIn - Fecha de entrada
 * @param {Date|string} checkOut - Fecha de salida
 * @returns {number} Precio total
 */
const calculateTotalPrice = (pricePerNight, checkIn, checkOut) => {
  const nights = calculateNights(checkIn, checkOut);
  return parseFloat((pricePerNight * nights).toFixed(2));
};

/**
 * Verificar si una fecha es anterior a otra
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {boolean} True si date1 es anterior
 */
const isDateBefore = (date1, date2) => {
  return new Date(date1) < new Date(date2);
};

/**
 * Verificar si una fecha es posterior a otra
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {boolean} True si date1 es posterior
 */
const isDateAfter = (date1, date2) => {
  return new Date(date1) > new Date(date2);
};

/**
 * Obtener fecha actual
 * @returns {string} Fecha actual en formato YYYY-MM-DD
 */
const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Agregar días a una fecha
 * @param {Date|string} date - Fecha base
 * @param {number} days - Días a agregar
 * @returns {Date} Nueva fecha
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Obtener diferencia de días entre dos fechas
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {number} Diferencia en días
 */
const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ============================================
// FUNCIONES DE PAGINACIÓN
// ============================================

/**
 * Calcular offset y limit para paginación
 * @param {number} page - Número de página (comienza en 1)
 * @param {number} pageSize - Tamaño de página
 * @returns {object} { offset, limit }
 */
const getPaginationParams = (page = 1, pageSize = DEFAULTS.ITEMS_PER_PAGE) => {
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedPageSize = Math.min(parseInt(pageSize) || DEFAULTS.ITEMS_PER_PAGE, 100);
  
  const offset = (parsedPage - 1) * parsedPageSize;
  
  return {
    offset,
    limit: parsedPageSize,
    page: parsedPage,
    pageSize: parsedPageSize
  };
};

/**
 * Crear respuesta paginada
 * @param {array} data - Datos de la página
 * @param {number} total - Total de registros
 * @param {number} page - Página actual
 * @param {number} pageSize - Tamaño de página
 * @returns {object} Respuesta paginada
 */
const createPaginatedResponse = (data, total, page = 1, pageSize = DEFAULTS.ITEMS_PER_PAGE) => {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

// ============================================
// FUNCIONES DE GENERACIÓN
// ============================================

/**
 * Generar ID único (UUID v4)
 * @returns {string} UUID
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generar número de confirmación de reserva
 * @param {number} reservationId - ID de reserva
 * @returns {string} Número de confirmación
 */
const generateConfirmationNumber = (reservationId) => {
  const prefix = 'RES';
  const timestamp = Date.now().toString().slice(-6);
  const id = String(reservationId).padStart(4, '0');
  return `${prefix}-${timestamp}-${id}`;
};

/**
 * Generar número de transacción de pago
 * @param {number} paymentId - ID de pago
 * @returns {string} Número de transacción
 */
const generateTransactionNumber = (paymentId) => {
  const prefix = 'PAY';
  const timestamp = Date.now().toString().slice(-8);
  const id = String(paymentId).padStart(4, '0');
  return `${prefix}-${timestamp}-${id}`;
};

/**
 * Generar código de verificación (6 dígitos)
 * @returns {string} Código de 6 dígitos
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// FUNCIONES DE CONVERSIÓN
// ============================================

/**
 * Convertir objeto a JSON seguro
 * @param {object} obj - Objeto a convertir
 * @returns {string} JSON string
 */
const toJSON = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
};

/**
 * Convertir JSON string a objeto
 * @param {string} jsonStr - String JSON
 * @returns {object} Objeto parseado
 */
const parseJSON = (jsonStr) => {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
};

/**
 * Convertir objeto a query string
 * @param {object} obj - Objeto a convertir
 * @returns {string} Query string
 */
const toQueryString = (obj) => {
  return Object.entries(obj)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

/**
 * Convertir query string a objeto
 * @param {string} queryStr - Query string
 * @returns {object} Objeto parseado
 */
const parseQueryString = (queryStr) => {
  const params = new URLSearchParams(queryStr);
  const obj = {};
  
  for (const [key, value] of params) {
    obj[key] = value;
  }
  
  return obj;
};

// ============================================
// FUNCIONES DE COMPARACIÓN/BÚSQUEDA
// ============================================

/**
 * Comparar dos objetos
 * @param {object} obj1 - Primer objeto
 * @param {object} obj2 - Segundo objeto
 * @returns {boolean} True si son iguales
 */
const deepEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

/**
 * Filtrar array por búsqueda de texto
 * @param {array} data - Array a filtrar
 * @param {string} searchTerm - Término de búsqueda
 * @param {array} fields - Campos donde buscar
 * @returns {array} Array filtrado
 */
const searchInArray = (data, searchTerm, fields = []) => {
  if (!searchTerm || fields.length === 0) return data;
  
  const term = searchTerm.toLowerCase();
  
  return data.filter(item =>
    fields.some(field =>
      String(item[field]).toLowerCase().includes(term)
    )
  );
};

/**
 * Ordenar array por campo
 * @param {array} data - Array a ordenar
 * @param {string} field - Campo por el que ordenar
 * @param {string} order - 'ASC' o 'DESC'
 * @returns {array} Array ordenado
 */
const sortByField = (data, field, order = 'ASC') => {
  return [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    
    if (order === 'ASC') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

/**
 * Agrupar array por campo
 * @param {array} data - Array a agrupar
 * @param {string} field - Campo por el que agrupar
 * @returns {object} Datos agrupados
 */
const groupByField = (data, field) => {
  return data.reduce((acc, item) => {
    const key = item[field];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
};

// ============================================
// FUNCIONES DE MANEJO DE ERRORES
// ============================================

/**
 * Crear objeto de error personalizado
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código HTTP
 * @param {array} errors - Errores adicionales
 * @returns {Error} Error personalizado
 */
const createError = (message, statusCode = 400, errors = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (errors) error.errors = errors;
  return error;
};

/**
 * Validar objeto contra esquema
 * @param {object} data - Datos a validar
 * @param {object} schema - Esquema de validación
 * @returns {object} { valid: boolean, errors: object }
 */
const validateObject = (data, schema) => {
  const errors = {};
  let valid = true;
  
  Object.entries(schema).forEach(([field, validation]) => {
    if (validation.required && !data[field]) {
      errors[field] = `${field} es requerido`;
      valid = false;
    }
    
    if (validation.type && data[field] && typeof data[field] !== validation.type) {
      errors[field] = `${field} debe ser de tipo ${validation.type}`;
      valid = false;
    }
    
    if (validation.minLength && data[field]?.length < validation.minLength) {
      errors[field] = `${field} debe tener al menos ${validation.minLength} caracteres`;
      valid = false;
    }
    
    if (validation.maxLength && data[field]?.length > validation.maxLength) {
      errors[field] = `${field} no puede tener más de ${validation.maxLength} caracteres`;
      valid = false;
    }
    
    if (validation.min && data[field] < validation.min) {
      errors[field] = `${field} debe ser mayor o igual a ${validation.min}`;
      valid = false;
    }
    
    if (validation.max && data[field] > validation.max) {
      errors[field] = `${field} debe ser menor o igual a ${validation.max}`;
      valid = false;
    }
    
    if (validation.pattern && !validation.pattern.test(data[field])) {
      errors[field] = `${field} tiene un formato inválido`;
      valid = false;
    }
  });
  
  return { valid, errors };
};

// ============================================
// FUNCIONES DE UTILIDAD GENERAL
// ============================================

/**
 * Hacer copia profunda de objeto
 * @param {object} obj - Objeto a copiar
 * @returns {object} Copia del objeto
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Fusionar dos objetos
 * @param {object} obj1 - Primer objeto
 * @param {object} obj2 - Segundo objeto
 * @returns {object} Objetos fusionados
 */
const mergeObjects = (obj1, obj2) => {
  return { ...obj1, ...obj2 };
};

/**
 * Obtener valor anidado de objeto
 * @param {object} obj - Objeto
 * @param {string} path - Ruta anidada (ej: 'user.address.city')
 * @returns {*} Valor encontrado o undefined
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
};

/**
 * Esperar tiempo específico (Promise)
 * @param {number} ms - Milisegundos
 * @returns {Promise}
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Reintentar función
 * @param {function} fn - Función a reintentar
 * @param {number} maxRetries - Máximo de intentos
 * @param {number} delay - Delay entre intentos
 * @returns {*} Resultado de la función
 */
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay);
    }
  }
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================

module.exports = {
  // Formateo
  formatCurrency,
  formatDate,
  formatDateTime,
  slugify,
  capitalize,
  truncate,
  
  // Validación
  isValidEmail,
  isValidDocument,
  isValidPhone,
  isValidURL,
  validatePassword,
  validateObject,
  
  // Fechas
  calculateNights,
  calculateTotalPrice,
  isDateBefore,
  isDateAfter,
  getCurrentDate,
  addDays,
  getDaysDifference,
  
  // Paginación
  getPaginationParams,
  createPaginatedResponse,
  
  // Generación
  generateUUID,
  generateConfirmationNumber,
  generateTransactionNumber,
  generateVerificationCode,
  
  // Conversión
  toJSON,
  parseJSON,
  toQueryString,
  parseQueryString,
  
  // Comparación/Búsqueda
  deepEqual,
  searchInArray,
  sortByField,
  groupByField,
  
  // Errores
  createError,
  
  // Utilidades generales
  deepClone,
  mergeObjects,
  getNestedValue,
  sleep,
  retry
};