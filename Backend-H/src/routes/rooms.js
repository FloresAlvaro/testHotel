const express = require('express');
const RoomController = require('../controllers/roomController');
const authorize = require('../middleware/authorization');

const router = express.Router();

router.get('/available', RoomController.getAvailable);
router.get('/available-for-dates', RoomController.getAvailableForDates);
router.get('/occupancy', RoomController.getOccupancyStatus);
router.get('/floor/:floor', RoomController.getByFloor);
router.get('/:id', RoomController.getById);
router.get('/', RoomController.getAll);
router.post('/', authorize('admin', 'manager'), RoomController.create);
router.put('/:id', authorize('admin', 'manager'), RoomController.update);
router.patch('/:id/status', authorize('admin', 'manager'), RoomController.updateStatus);

module.exports = router;
