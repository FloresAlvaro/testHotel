const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const swaggerSpec = require('./config/swagger');
const database = require('./config/database');
const requestId = require('./middleware/requestId');
const {
  CORS_ORIGIN,
  CORS_CREDENTIALS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  LOG_FORMAT,
} = require('./config/environment');

const app = express();
app.use(requestId);

// Registrar también solicitudes rechazadas por CORS o por el límite de solicitudes.
morgan.token('request-id', (req) => req.requestId);
const logFormat =
  LOG_FORMAT === 'json'
    ? (tokens, req, res) =>
        JSON.stringify({
          requestId: req.requestId,
          method: tokens.method(req, res),
          path: req.originalUrl.split('?')[0],
          status: Number(tokens.status(req, res)),
          durationMs: Number(tokens['response-time'](req, res)),
        })
    : `:request-id ${morgan[LOG_FORMAT] || LOG_FORMAT}`;
app.use(morgan(logFormat));

// Seguridad
app.use(helmet());
const allowedOrigins = CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    exposedHeaders: ['X-Request-ID'],
    credentials: CORS_CREDENTIALS && !allowedOrigins.includes('*'),
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(Object.assign(new Error('Origen CORS no permitido'), { statusCode: 403 }));
    },
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  skip: (req) => req.path === '/users/login',
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentacion OpenAPI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// Rutas
app.use('/api', routes);

// Health check
app.get('/health', async (req, res) => {
  const ready = await database.testConnection();
  res.status(ready ? 200 : 503).json({
    status: ready ? 'OK' : 'unavailable',
    database: ready ? 'available' : 'unavailable',
    timestamp: new Date(),
  });
});

// Manejo de errores
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

module.exports = app;
