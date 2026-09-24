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

const authorizeSelfOrAdmin = (req, res, next) => {
	if (req.user.role !== 'admin' && String(req.user.id) !== String(req.params.id)) {
		return res.status(403).json({ message: 'No tiene permiso para modificar este usuario' });
	}

	next();
};

// Públicas
router.post('/register', validate(registerSchema), UserController.register);
router.post('/login', validate(loginSchema), UserController.login);

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