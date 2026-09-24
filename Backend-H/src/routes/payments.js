const express = require('express');
const PaymentController = require('../controllers/paymentController');
const authorize = require('../middleware/authorization');
const validate = require('../middleware/validation');
const { createSchema, updateStatusSchema } = require('../validators/paymentValidator');

const router = express.Router();

router.get('/pending', PaymentController.getPending);
router.get('/revenue/period', authorize('admin', 'manager'), PaymentController.getRevenueByPeriod);
router.get('/revenue/method', authorize('admin', 'manager'), PaymentController.getRevenueByMethod);
router.get('/reservation/:reservationId', PaymentController.getByReservation);
router.get('/:id', PaymentController.getById);
router.get('/', PaymentController.getAll);
router.post('/', authorize('admin', 'manager', 'receptionist'), validate(createSchema), PaymentController.create);
router.patch('/:id/status', authorize('admin', 'manager'), validate(updateStatusSchema), PaymentController.updateStatus);
router.patch('/:id/complete', authorize('admin', 'manager'), PaymentController.complete);
router.patch('/:id/refund', authorize('admin', 'manager'), PaymentController.refund);

module.exports = router;
