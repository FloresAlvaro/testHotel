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
  RATE_LIMIT_MAX_REQUESTS,
  TRUST_PROXY
} = require('./config/environment');

const app = express();

app.set('trust proxy',TRUST_PROXY);
app.use(require('./middleware/requestId'));
// Logging
morgan.token('request-id',req=>req.requestId);
app.use(morgan((tokens,req,res)=>JSON.stringify({requestId:req.requestId,method:req.method,path:req.originalUrl.split('?')[0],status:Number(tokens.status(req,res)),durationMs:Number(tokens['response-time'](req,res))})));

// Seguridad
app.use(helmet());
const allowedOrigins = CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  exposedHeaders: ['X-Request-ID'],
  credentials: CORS_CREDENTIALS && !allowedOrigins.includes('*'),
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(Object.assign(new Error('Origen CORS no permitido'),{statusCode:403}));
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
app.get('/health', async (req,res)=>{
  const ready=await require('./config/database').testConnection();
  res.status(ready?200:503).json({status:ready?'OK':'unavailable',database:ready?'available':'unavailable',timestamp:new Date()});
});

// Manejo de errores
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

module.exports = app;