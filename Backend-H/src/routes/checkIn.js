const express = require('express');
const CheckInController = require('../controllers/checkInController');
const authorize = require('../middleware/authorization');

const Joi = require('joi');
const validate = require('../middleware/validation');
const { id } = require('../validators/common');
const checkInSchema = Joi.object({
  reservation_id: id.required(),
  notes: Joi.string().max(2000).allow('', null),
});
const checkOutSchema = Joi.object({ reservation_id: id.required() });

const router = express.Router();
require('../validators/common').configureRouter(router);

router.post(
  '/',
  authorize('admin', 'manager', 'receptionist'),
  validate(checkInSchema),
  CheckInController.checkIn,
);
router.post(
  '/check-out',
  authorize('admin', 'manager', 'receptionist'),
  validate(checkOutSchema),
  CheckInController.checkOut,
);
router.get('/today', CheckInController.getTodayCheckIns);
router.get('/pending-check-outs', CheckInController.getPendingCheckOuts);
router.get('/reservation/:reservationId', CheckInController.getByReservation);
router.get('/client/:clientId/history', CheckInController.getClientHistory);

module.exports = router;
