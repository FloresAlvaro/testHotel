const express = require('express');
const rateLimit = require('express-rate-limit');
const UserController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');
const validate = require('../middleware/validation');
const { RATE_LIMIT_WINDOW_MS } = require('../config/environment');
const {
	registerSchema,
	loginSchema,
	updateSchema,
	changePasswordSchema
} = require('../validators/userValidator');

const router = express.Router();
require('../validators/common').configureRouter(router);
const loginRateLimiter = rateLimit({
	windowMs: RATE_LIMIT_WINDOW_MS,
	max: 10,
	skipSuccessfulRequests: true,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en unos minutos.'
	}
});

const authorizeSelfOrAdmin = (req, res, next) => {
	if (req.user.role !== 'admin' && String(req.user.id) !== String(req.params.id)) {
		return res.status(403).json({ message: 'No tiene permiso para modificar este usuario' });
	}

	next();
};

// Públicas
router.post('/register', auth, authorize('admin'), validate(registerSchema), UserController.register);
router.post('/login', loginRateLimiter, validate(loginSchema), UserController.login);

// Protegidas
router.get('/profile', auth, UserController.getProfile);
router.get('/search', auth, authorize('admin'), UserController.search);
router.get('/', auth, authorize('admin'), UserController.getAll);
router.get('/:id', auth, authorize('admin'), UserController.getById);
router.put('/:id', auth, authorize('admin'), validate(updateSchema), UserController.update);
router.patch('/:id/password', auth, authorizeSelfOrAdmin, validate(changePasswordSchema), UserController.changePassword);
router.patch('/:id/deactivate', auth, authorize('admin'), UserController.deactivate);
router.patch('/:id/activate', auth, authorize('admin'), UserController.activate);

module.exports = router;
