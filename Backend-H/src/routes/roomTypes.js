const express = require('express');
const RoomTypeController = require('../controllers/roomTypeController');
const authorize = require('../middleware/authorization');

const router = express.Router();

router.get('/:id/availability', RoomTypeController.getAvailabilityStats);
router.get('/:id', RoomTypeController.getById);
router.get('/', RoomTypeController.getAll);
router.post('/', authorize('admin', 'manager'), RoomTypeController.create);
router.put('/:id', authorize('admin', 'manager'), RoomTypeController.update);
router.patch('/:id/deactivate', authorize('admin', 'manager'), RoomTypeController.deactivate);

module.exports = router;
