const { Pool } = require('pg');
const {
  DATABASE_URL,
  NODE_ENV,
  DB_POOL_MIN,
  DB_POOL_MAX,
  DB_IDLE_TIMEOUT,
  DB_CONNECT_TIMEOUT,
  ENABLE_HEALTH_CHECK,
  HEALTH_CHECK_INTERVAL
} = require('./environment');

// ============================================
// VALIDAR CONFIGURACIÓN
// ============================================

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está definida en las variables de entorno');
  process.exit(1);
}

// ============================================
// CONFIGURAR POOL DE CONEXIONES
// ============================================

const requestContext = require('../utils/requestContext');
const applyContext = async (client) => {
  const context = requestContext.getStore() || {};
  await client.query("SELECT set_config('hotel.actor_id',$1,true), set_config('hotel.actor_ip',$2,true)", [String(context.userId || ''), context.ip || '']);
  await client.query("SELECT set_config('TimeZone', timezone, true) FROM hotel_settings WHERE id=1");
};

const poolConfig = {
  connectionString: DATABASE_URL,
  max: DB_POOL_MAX,
  min: DB_POOL_MIN,
  idleTimeoutMillis: DB_IDLE_TIMEOUT,
  connectionTimeoutMillis: DB_CONNECT_TIMEOUT,
  allowExitOnIdle: false, // no cerrar pool automáticamente
  application_name: 'hotel-system' // nombre de la aplicación en la BD
};

const pool = new Pool(poolConfig);
const queryPool = pool.query.bind(pool);

// ============================================
// VALIDAR CONEXIÓN AL INICIAR
// ============================================

let isConnected = false;

const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log(`✅ Conexión a PostgreSQL establecida: ${result.rows[0].now}`);
    isConnected = true;
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    isConnected = false;
    return false;
  } finally { client?.release(); }
};

// Intentar conectar al iniciar
if (NODE_ENV !== 'test' && NODE_ENV !== 'testing') testConnection();

// ============================================
// MANEJADORES DE EVENTOS DEL POOL
// ============================================

// Cuando se crea una nueva conexión
pool.on('connect', (client) => {
  console.log('📌 Nueva conexión creada en el pool');
});

// Cuando hay un error en el pool
pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en el pool de conexión:', err);
  console.error('Detalles:', {
    message: err.message,
    code: err.code,
    severity: err.severity
  });
});

// Cuando se cierra el pool
pool.on('remove', () => {
  console.log('📌 Conexión removida del pool');
});

// ============================================
// FUNCIONES ÚTILES
// ============================================

/**
 * Obtener estado actual del pool
 */
const getPoolStats = () => {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    active: pool.totalCount - pool.idleCount,
    waiting: pool.waitingCount
  };
};

/**
 * Obtener una conexión del pool
 */
const getConnection = async () => {
  try {
    if (!isConnected) {
      throw new Error('La base de datos no está disponible');
    }
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('Error obteniendo conexión:', error.message);
    throw error;
  }
};

/**
 * Ejecutar una query
 */
const query = async (text, params) => {
  if (!isConnected) {
    throw new Error('La base de datos no está disponible');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await applyContext(client);
    const result = await client.query(text, params);
    await client.query('COMMIT');
    return result;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
};

/**
 * Ejecutar una transacción
 */
const transaction = async (callback, { readOnly = false } = {}) => {
  const client = await getConnection();

  try {
    await client.query(readOnly ? 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY' : 'BEGIN');
    await applyContext(client);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en transacción:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Verificar disponibilidad de la BD
 */
const isReady = () => {
  return isConnected && pool.totalCount > 0;
};

/**
 * Reconectar al pool
 */
const reconnect = async () => {
  console.log('🔄 Intentando reconectar a la base de datos...');
  return await testConnection();
};

/**
 * Cerrar el pool de forma segura
 */
const close = async () => {
  try {
    if(healthCheckTimer)clearInterval(healthCheckTimer);
    await pool.end();
    console.log('✓ Pool de conexiones cerrado correctamente');
    isConnected = false;
  } catch (error) {
    console.error(JSON.stringify({event:'database_close_failed'}));
    throw error;
  }
};

/**
 * Verificar estado de la BD periódicamente
 */
const startHealthCheck = (interval = 60000) => {
  const timer=setInterval(async () => {
    try {
      const result = await queryPool('SELECT 1');
      if (!isConnected) {
        isConnected = true;
        console.log('✅ Conexión a BD restaurada');
      }
    } catch (error) {
      if (isConnected) {
        isConnected = false;
        console.error('⚠️ Conexión a BD perdida');
      }
    }
  }, interval);
  timer.unref();
  return timer;
};

const healthCheckTimer=ENABLE_HEALTH_CHECK?startHealthCheck(HEALTH_CHECK_INTERVAL):null;

// ============================================
// EXPORTAR
// ============================================

module.exports = pool;
module.exports.getConnection = getConnection;
module.exports.query = query;
module.exports.transaction = transaction;
module.exports.getPoolStats = getPoolStats;
module.exports.isReady = isReady;
module.exports.reconnect = reconnect;
module.exports.close = close;
module.exports.testConnection = testConnection;