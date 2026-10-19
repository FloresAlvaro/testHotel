const express = require('express');
const UserController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');
const validate = require('../middleware/validation');
const {
	registerSchema,
	loginSchema,
	updateSchema,
	changePasswordSchema
} = require('../validators/userValidator');

const router = express.Router();
const loginLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, max: 20, skipSuccessfulRequests: true,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos fallidos. Intenta nuevamente en unos minutos.' }
});

const authorizeSelfOrAdmin = (req, res, next) => {
	if (req.user.role !== 'admin' && String(req.user.id) !== String(req.params.id)) {
		return res.status(403).json({ message: 'No tiene permiso para modificar este usuario' });
	}

	next();
};

// Alta de empleados exclusivamente administrada; alias conservado para clientes existentes.
router.post('/register', auth, authorize('admin'), validate(registerSchema), UserController.register);
router.post('/', auth, authorize('admin'), validate(registerSchema), UserController.register);

router.use(require('./passwordRecovery'));

router.use(require('./invitations'));
const sessions = require('../services/sessionService');
router.post('/session', loginLimiter, sessions.trustedRequest, validate(require('../utils/contractValidator').byName('SessionLoginInput')), UserController.login);
router.get('/session', auth, async(req,res,next)=>{
 try { if(!req.session)return res.status(401).json({message:'Inicia una sesión de navegador'});
 const user=await require('../models/User').findById(req.user.id);
 res.json({success:true,data:{user,csrfToken:req.session.csrf_token}});
 } catch(error){next(error);}
});
router.delete('/session', sessions.trustedRequest, auth, async(req,res,next)=>{
 try{await sessions.destroy(req,res);res.json({success:true,data:null});}catch(error){next(error);}
});

// Pública
router.post('/login', loginLimiter, validate(loginSchema), UserController.login);

// Protegidas
router.get('/profile', auth, UserController.getProfile);
router.get('/search', auth, authorize('admin'), UserController.search);
router.get('/', auth, authorize('admin'), validate(require('../validators/listValidator').schema(['active','inactive']), 'query'), UserController.getAll);
router.get('/:id', auth, authorize('admin'), UserController.getById);
router.put('/:id', auth, authorize('admin'), validate(updateSchema), UserController.update);
router.patch('/:id/password', auth, authorizeSelfOrAdmin, validate(changePasswordSchema), UserController.changePassword);
router.patch('/:id/deactivate', auth, authorize('admin'), UserController.deactivate);
router.patch('/:id/activate', auth, authorize('admin'), UserController.activate);

module.exports = router;