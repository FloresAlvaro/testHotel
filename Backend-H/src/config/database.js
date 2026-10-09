const { Pool, types } = require('pg');
const details = require('../utils/errorDetails');
// DATE representa un día de calendario, no un instante en la zona horaria del servidor.
types.setTypeParser(1082, (value) => value);
const {
  DATABASE_URL,
  NODE_ENV,
  DB_POOL_MIN,
  DB_POOL_MAX,
  DB_IDLE_TIMEOUT,
  DB_CONNECT_TIMEOUT,
  ENABLE_HEALTH_CHECK,
  HEALTH_CHECK_INTERVAL,
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

const poolConfig = {
  connectionString: DATABASE_URL,
  max: DB_POOL_MAX,
  min: DB_POOL_MIN,
  idleTimeoutMillis: DB_IDLE_TIMEOUT,
  connectionTimeoutMillis: DB_CONNECT_TIMEOUT,
  allowExitOnIdle: false, // no cerrar pool automáticamente
  application_name: 'hotel-system', // nombre de la aplicación en la BD
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
    console.error('❌ Error conectando a PostgreSQL:', details(error).message);
    isConnected = false;
    return false;
  } finally {
    if (client) client.release();
  }
};

// Intentar conectar al iniciar
if (NODE_ENV !== 'test') testConnection();

// ============================================
// MANEJADORES DE EVENTOS DEL POOL
// ============================================

// Cuando se crea una nueva conexión
pool.on('connect', () => {
  if (NODE_ENV === 'development') console.log('📌 Nueva conexión creada en el pool');
});

// Cuando hay un error en el pool
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de conexión:', err);
  console.error('Detalles:', {
    message: err.message,
    code: details(err).code,
    severity: details(err).severity,
  });
});

// Cuando se cierra el pool
pool.on('remove', () => {
  if (NODE_ENV === 'development') console.log('📌 Conexión removida del pool');
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
    waiting: pool.waitingCount,
  };
};

/**
 * Obtener una conexión del pool
 */
const getConnection = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('Error obteniendo conexión:', details(error).message);
    throw error;
  }
};

/**
 * Ejecutar una query
 * @param {string} text
 * @param {unknown[]} [params]
 */
const query = async (text, params) => {
  const start = Date.now();

  try {
    const result = await queryPool(text, params);
    const duration = Date.now() - start;

    // Log de queries en desarrollo
    if (NODE_ENV === 'development') {
      console.log(`✓ Query ejecutada en ${duration}ms`);
    }

    return result;
  } catch (error) {
    console.error('Error en query:', { code: details(error).code });
    throw error;
  }
};

/**
 * Ejecutar una transacción
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>}
 */
const transaction = async (callback) => {
  const client = await getConnection();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error haciendo rollback:', details(rollbackError).message);
    }
    console.error('Error en transacción:', details(error).message);
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
    if (healthCheckTimer) clearInterval(healthCheckTimer);
    await pool.end();
    console.log('✓ Pool de conexiones cerrado correctamente');
    isConnected = false;
  } catch (error) {
    console.error('Error cerrando pool:', details(error).message);
    throw error;
  }
};

/**
 * Verificar estado de la BD periódicamente
 * @param {number} interval
 */
const startHealthCheck = (interval) => {
  return setInterval(async () => {
    try {
      await queryPool('SELECT 1');
      if (!isConnected) {
        isConnected = true;
        console.log('✅ Conexión a BD restaurada');
      }
    } catch {
      if (isConnected) {
        isConnected = false;
        console.error('⚠️ Conexión a BD perdida');
      }
    }
  }, interval);
};

// Iniciar health check
const healthCheckTimer = ENABLE_HEALTH_CHECK ? startHealthCheck(HEALTH_CHECK_INTERVAL) : null;

// ============================================
// MANEJO DE CIERRE GRACEFUL
// ============================================

// ============================================
// EXPORTAR
// ============================================

module.exports = Object.assign(pool, {
  getConnection,
  query,
  transaction,
  getPoolStats,
  isReady,
  reconnect,
  close,
  testConnection,
});
