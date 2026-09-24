const express = require('express');
const ReservationController = require('../controllers/reservationController');
const authorize = require('../middleware/authorization');
const validate = require('../middleware/validation');
const { createSchema, updateSchema } = require('../validators/reservationValidator');

const router = express.Router();

router.get('/active', ReservationController.getActive);
router.get('/upcoming', ReservationController.getUpcoming);
router.get('/client/:clientId', ReservationController.getByClient);
router.get('/:id', ReservationController.getById);
router.get('/', ReservationController.getAll);
router.post('/', authorize('admin', 'manager', 'receptionist'), validate(createSchema), ReservationController.create);
router.put('/:id', authorize('admin', 'manager'), validate(updateSchema), ReservationController.update);
router.patch('/:id/cancel', authorize('admin', 'manager', 'receptionist'), ReservationController.cancel);

module.exports = router;
