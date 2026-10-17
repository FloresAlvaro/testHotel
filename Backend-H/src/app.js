const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const swaggerSpec = require('./config/swagger');
const {
  CORS_ORIGIN,
  CORS_CREDENTIALS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS
} = require('./config/environment');

const app = express();

// Seguridad
app.use(helmet());
const allowedOrigins = CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  credentials: CORS_CREDENTIALS && !allowedOrigins.includes('*'),
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen CORS no permitido'));
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes. Espera unos minutos antes de volver a intentar.' }
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// La firma de Stripe se comprueba contra los bytes originales, antes de express.json.
app.post('/api/webhooks/stripe', express.raw({type:'application/json',limit:'256kb'}), async(req,res,next)=>{
  const service=require('./services/onlinePaymentService');
  if(process.env.PAYMENT_PROVIDER!=='stripe'||!service.enabled())return res.sendStatus(404);
  let event;
  try{event=service.stripe().webhooks.constructEvent(req.body,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);}catch{return res.status(400).json({message:'Firma de webhook no válida'});}
  try{await service.handleEvent(event);res.json({received:true});}catch(error){next(error);}
});
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
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Manejo de errores
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

module.exports = app;