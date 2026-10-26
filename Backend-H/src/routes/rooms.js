const express = require('express');
const RoomController = require('../controllers/roomController');
const authorize = require('../middleware/authorization');

const router = express.Router();
const validate=require('../middleware/validation');
const schema=require('../validators/roomValidator');
router.param('id',(req,res,next)=>validate(schema.id,'params')(req,res,next));

router.get('/available', RoomController.getAvailable);
router.get('/available-for-dates', validate(schema.dates,'query'), RoomController.getAvailableForDates);
router.get('/occupancy', RoomController.getOccupancyStatus);
router.get('/floor/:floor', validate(schema.floor,'params'), RoomController.getByFloor);
router.get('/:id', RoomController.getById);
router.get('/', validate(require('../validators/listValidator').schema(['available','reserved','occupied','maintenance']).append({floor:require('joi').number().integer().min(0).max(2147483647)}),'query'), RoomController.getAll);
router.post('/', authorize('admin', 'manager'), validate(schema.roomCreate), RoomController.create);
router.put('/:id', authorize('admin', 'manager'), validate(schema.roomUpdate), RoomController.update);
router.patch('/:id/status', authorize('admin', 'manager'), validate(schema.roomStatus), RoomController.updateStatus);

module.exports = router;
