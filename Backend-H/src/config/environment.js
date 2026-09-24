require('dotenv').config();

// ============================================
// VALIDAR VARIABLES REQUERIDAS
// ============================================

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ ERROR: Faltan las siguientes variables de entorno:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  process.exit(1);
}

// ============================================
// VALIDAR FORMATO DE DATABASE_URL
// ============================================

const validateDatabaseURL = (url) => {
  try {
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      throw new Error('DATABASE_URL debe comenzar con postgresql:// o postgres://');
    }
    return true;
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
};

validateDatabaseURL(process.env.DATABASE_URL);

// ============================================
// VALIDAR PUERTO
// ============================================

const validatePort = (port) => {
  const parsedPort = parseInt(port);
  if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    console.error('❌ ERROR: PORT debe ser un número entre 1 y 65535');
    process.exit(1);
  }
  return parsedPort;
};

// ============================================
// VALIDAR NODE_ENV
// ============================================

const validateNodeEnv = (env) => {
  const validEnvs = ['development', 'production', 'testing', 'test'];
  if (!validEnvs.includes(env)) {
    console.error(`❌ ERROR: NODE_ENV debe ser: ${validEnvs.join(', ')}`);
    process.exit(1);
  }
  return env;
};

// ============================================
// VALIDAR JWT_SECRET
// ============================================

const validateJWTSecret = (secret) => {
  if (secret === 'your-secret-key') {
    console.warn('⚠️ ADVERTENCIA: Estás usando el JWT_SECRET por defecto. Cambia esto en producción.');
  }
  if (secret.length < 32) {
    console.warn('⚠️ ADVERTENCIA: JWT_SECRET debería tener al menos 32 caracteres.');
  }
  return secret;
};

// ============================================
// VALIDAR BCRYPT_ROUNDS
// ============================================

const validateBcryptRounds = (rounds) => {
  const parsedRounds = parseInt(rounds);
  if (isNaN(parsedRounds) || parsedRounds < 8 || parsedRounds > 15) {
    console.error('❌ ERROR: BCRYPT_ROUNDS debe ser un número entre 8 y 15');
    process.exit(1);
  }
  return parsedRounds;
};

// ============================================
// VARIABLES VALIDADAS
// ============================================

const NODE_ENV = validateNodeEnv(process.env.NODE_ENV || 'development');
const PORT = validatePort(process.env.PORT || 3000);
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = validateJWTSecret(process.env.JWT_SECRET);
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';
const BCRYPT_ROUNDS = validateBcryptRounds(process.env.BCRYPT_ROUNDS || 10);

// ============================================
// CONFIGURACIÓN POR ENTORNO
// ============================================

const isDevelopment = NODE_ENV === 'development';
const isProduction = NODE_ENV === 'production';
const isTesting = NODE_ENV === 'testing' || NODE_ENV === 'test';

// ============================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================

const CORS_ORIGIN = process.env.CORS_ORIGIN || (isDevelopment ? '*' : 'https://yourdomain.com');
const CORS_CREDENTIALS = process.env.CORS_CREDENTIALS === 'true';

// ============================================
// CONFIGURACIÓN DE RATE LIMITING
// ============================================

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000, 10); // 15 minutos
const configuredRateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100, 10);
const RATE_LIMIT_MAX_REQUESTS = isProduction ? 50 : configuredRateLimitMax;

// ============================================
// CONFIGURACIÓN DE LOGGING
// ============================================

const LOG_LEVEL = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
const LOG_FORMAT = process.env.LOG_FORMAT || 'combined';

// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// ============================================

const DB_POOL_MIN = parseInt(process.env.DB_POOL_MIN || (isProduction ? 5 : 2));
const DB_POOL_MAX = parseInt(process.env.DB_POOL_MAX || (isProduction ? 30 : 20));
const DB_IDLE_TIMEOUT = parseInt(process.env.DB_IDLE_TIMEOUT || 30000);
const DB_CONNECT_TIMEOUT = parseInt(process.env.DB_CONNECT_TIMEOUT || (isProduction ? 5000 : 2000));

// ============================================
// CONFIGURACIÓN DE ARCHIVO
// ============================================

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || 5242880); // 5MB
const ALLOWED_MIME_TYPES = process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/jpg';

// ============================================
// CONFIGURACIÓN DE EMAIL (Opcional)
// ============================================

const SMTP_HOST = process.env.SMTP_HOST || null;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || null;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || null;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@hotel.com';

// ============================================
// CONFIGURACIÓN DE API EXTERNA (Opcional)
// ============================================

const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY || null;
const PAYMENT_API_URL = process.env.PAYMENT_API_URL || null;

// ============================================
// CONFIGURACIÓN DE SESIÓN
// ============================================

const SESSION_SECRET = process.env.SESSION_SECRET || (isDevelopment ? 'session-secret' : process.env.JWT_SECRET);
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || 86400000); // 24 horas

// ============================================
// CONFIGURACIÓN DE MONITOREO
// ============================================

const ENABLE_HEALTH_CHECK = process.env.ENABLE_HEALTH_CHECK !== 'false';
const HEALTH_CHECK_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL || 60000); // 1 minuto

// ============================================
// VALIDACIONES ADICIONALES
// ============================================

if (isProduction) {
  if (JWT_SECRET.length < 32) {
    console.error('❌ ERROR: En producción, JWT_SECRET debe tener al menos 32 caracteres');
    process.exit(1);
  }

  if (JWT_SECRET === process.env.JWT_SECRET && !process.env.JWT_SECRET) {
    console.error('❌ ERROR: Debes establecer JWT_SECRET en producción');
    process.exit(1);
  }

  if (CORS_ORIGIN === '*') {
    console.warn('⚠️ ADVERTENCIA: En producción, CORS_ORIGIN no debería ser "*"');
  }
}

// ============================================
// MOSTRAR CONFIGURACIÓN (solo en desarrollo)
// ============================================

if (isDevelopment) {
  console.log('\n📋 Configuración Cargada:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`NODE_ENV: ${NODE_ENV}`);
  console.log(`PORT: ${PORT}`);
  console.log(`DATABASE: ${DATABASE_URL.split('@')[1]}`); // Solo mostrar host
  console.log(`JWT_EXPIRE: ${JWT_EXPIRE}`);
  console.log(`BCRYPT_ROUNDS: ${BCRYPT_ROUNDS}`);
  console.log(`LOG_LEVEL: ${LOG_LEVEL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ============================================
// EXPORTAR CONFIGURACIÓN
// ============================================

module.exports = {
  // Básico
  PORT,
  NODE_ENV,
  DATABASE_URL,
  
  // JWT
  JWT_SECRET,
  JWT_EXPIRE,
  
  // Seguridad
  BCRYPT_ROUNDS,
  SESSION_SECRET,
  SESSION_MAX_AGE,
  
  // CORS
  CORS_ORIGIN,
  CORS_CREDENTIALS,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  
  // Logging
  LOG_LEVEL,
  LOG_FORMAT,
  
  // Base de Datos
  DB_POOL_MIN,
  DB_POOL_MAX,
  DB_IDLE_TIMEOUT,
  DB_CONNECT_TIMEOUT,
  
  // Archivos
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  
  // Email
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_FROM,
  
  // API
  PAYMENT_API_KEY,
  PAYMENT_API_URL,
  
  // Monitoreo
  ENABLE_HEALTH_CHECK,
  HEALTH_CHECK_INTERVAL,
  
  // Banderas de entorno
  isDevelopment,
  isProduction,
  isTesting
};