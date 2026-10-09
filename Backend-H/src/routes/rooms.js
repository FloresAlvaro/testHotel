const express = require('express');
const RoomController = require('../controllers/roomController');
const authorize = require('../middleware/authorization');

const validate = require('../middleware/validation');
const {
  createSchema,
  updateSchema,
  statusSchema,
  availableSchema,
} = require('../validators/roomValidator');

const router = express.Router();
require('../validators/common').configureRouter(router);

router.get('/available', RoomController.getAvailable);
router.get(
  '/available-for-dates',
  validate(availableSchema, 'query'),
  RoomController.getAvailableForDates,
);
router.get('/occupancy', RoomController.getOccupancyStatus);
router.get('/floor/:floor', RoomController.getByFloor);
router.get('/:id', RoomController.getById);
router.get('/', RoomController.getAll);
router.post('/', authorize('admin', 'manager'), validate(createSchema), RoomController.create);
router.put('/:id', authorize('admin', 'manager'), validate(updateSchema), RoomController.update);
router.patch(
  '/:id/status',
  authorize('admin', 'manager'),
  validate(statusSchema),
  RoomController.updateStatus,
);

module.exports = router;
