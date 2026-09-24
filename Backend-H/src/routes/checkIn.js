const express = require('express');
const CheckInController = require('../controllers/checkInController');
const authorize = require('../middleware/authorization');

const router = express.Router();

router.post('/', authorize('admin', 'manager', 'receptionist'), CheckInController.checkIn);
router.post('/check-out', authorize('admin', 'manager', 'receptionist'), CheckInController.checkOut);
router.get('/today', CheckInController.getTodayCheckIns);
router.get('/pending-check-outs', CheckInController.getPendingCheckOuts);
router.get('/reservation/:reservationId', CheckInController.getByReservation);
router.get('/client/:clientId/history', CheckInController.getClientHistory);

module.exports = router;
