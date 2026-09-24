const { Pool } = require('pg');
const {
  DATABASE_URL,
  NODE_ENV,
  DB_POOL_MIN,
  DB_POOL_MAX,
  DB_IDLE_TIMEOUT,
  DB_CONNECT_TIMEOUT
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
  application_name: 'hotel-system' // nombre de la aplicación en la BD
};

const pool = new Pool(poolConfig);

// ============================================
// VALIDAR CONEXIÓN AL INICIAR
// ============================================

let isConnected = false;

const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log(`✅ Conexión a PostgreSQL establecida: ${result.rows[0].now}`);
    isConnected = true;
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    isConnected = false;
    return false;
  }
};

// Intentar conectar al iniciar
testConnection();

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

  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log de queries en desarrollo
    if (NODE_ENV === 'development') {
      console.log(`✓ Query ejecutada en ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    console.error('Error en query:', {
      query: text,
      params: params,
      error: error.message,
      code: error.code
    });
    throw error;
  }
};

/**
 * Ejecutar una transacción
 */
const transaction = async (callback) => {
  const client = await getConnection();

  try {
    await client.query('BEGIN');
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
    await pool.end();
    console.log('✓ Pool de conexiones cerrado correctamente');
    isConnected = false;
  } catch (error) {
    console.error('Error cerrando pool:', error.message);
  }
};

/**
 * Verificar estado de la BD periódicamente
 */
const startHealthCheck = (interval = 60000) => {
  setInterval(async () => {
    try {
      const result = await pool.query('SELECT 1');
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
};

// Iniciar health check
startHealthCheck();

// ============================================
// MANEJO DE CIERRE GRACEFUL
// ============================================

process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, cerrando pool...');
  await close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recibido, cerrando pool...');
  await close();
  process.exit(0);
});

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