const express = require('express');
const RoomTypeController = require('../controllers/roomTypeController');
const authorize = require('../middleware/authorization');

const router = express.Router();
const validate=require('../middleware/validation');
const schema=require('../validators/roomValidator');
router.param('id',(req,res,next)=>validate(schema.id,'params')(req,res,next));

router.get('/:id/availability', RoomTypeController.getAvailabilityStats);
router.get('/:id', RoomTypeController.getById);
router.get('/', validate(require('../validators/listValidator').schema([]),'query'), RoomTypeController.getAll);
router.post('/', authorize('admin', 'manager'), validate(schema.typeCreate), RoomTypeController.create);
router.put('/:id', authorize('admin', 'manager'), validate(schema.typeUpdate), RoomTypeController.update);
router.patch('/:id/deactivate', authorize('admin', 'manager'), RoomTypeController.deactivate);

module.exports = router;
