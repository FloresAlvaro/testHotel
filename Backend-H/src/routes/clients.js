const express = require('express');
const ClientController = require('../controllers/clientController');
const authorize = require('../middleware/authorization');
const validate = require('../middleware/validation');
const { createSchema, updateSchema } = require('../validators/clientValidator');

const router = express.Router();

router.get('/search', ClientController.search);
router.get('/:id/reservations', ClientController.getReservationHistory);
router.get('/:id/stats', ClientController.getStats);
router.get('/:id', ClientController.getById);
router.get('/', ClientController.getAll);
router.post('/', authorize('admin', 'manager', 'receptionist'), validate(createSchema), ClientController.create);
router.put('/:id', authorize('admin', 'manager', 'receptionist'), validate(updateSchema), ClientController.update);
router.delete('/:id', authorize('admin', 'manager'), ClientController.delete);

module.exports = router;
