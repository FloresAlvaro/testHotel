const express = require('express');
const RoomTypeController = require('../controllers/roomTypeController');
const authorize = require('../middleware/authorization');

const validate = require('../middleware/validation');
const { createSchema, updateSchema } = require('../validators/roomTypeValidator');

const router = express.Router();
require('../validators/common').configureRouter(router);

router.get('/:id/availability', RoomTypeController.getAvailabilityStats);
router.get('/:id', RoomTypeController.getById);
router.get('/', RoomTypeController.getAll);
router.post('/', authorize('admin', 'manager'), validate(createSchema), RoomTypeController.create);
router.put('/:id', authorize('admin', 'manager'), validate(updateSchema), RoomTypeController.update);
router.patch('/:id/deactivate', authorize('admin', 'manager'), RoomTypeController.deactivate);

module.exports = router;
