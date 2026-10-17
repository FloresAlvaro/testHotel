const express = require('express');
const ClientController = require('../controllers/clientController');
const authorize = require('../middleware/authorization');
const validate = require('../middleware/validation');
const { createSchema, updateSchema } = require('../validators/clientValidator');

const router = express.Router();
const Joi = require('joi');
router.param('id',(req,res,next,id)=>{
  if(!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id)<1) return res.status(400).json({success:false,message:'ID no válido'});
  next();
});
const account = require('../services/customerAccountService');
const { sendSuccess, sendCreated } = require('../utils/response');
const wrap = handler => (req,res,next) => Promise.resolve(handler(req,res)).catch(next);
router.get('/:id/account', authorize('admin'), wrap(async(req,res)=>sendSuccess(res,await account.findAccount(req.params.id))));
router.post('/:id/account', authorize('admin'), validate(Joi.object({
  email: Joi.string().trim().lowercase().email().max(200).required(),
  password: Joi.string().min(8).max(128).required()
})), wrap(async(req,res)=>sendCreated(res,await account.createAccount(req.params.id,req.body))));
router.patch('/:id/account', authorize('admin'), validate(Joi.object({is_active:Joi.boolean().required()})),
  wrap(async(req,res)=>sendSuccess(res,await account.changeAccess(req.params.id,req.body.is_active))));

router.get('/search', ClientController.search);
router.get('/:id/reservations', ClientController.getReservationHistory);
router.get('/:id/stats', ClientController.getStats);
router.get('/:id', ClientController.getById);
router.get('/', ClientController.getAll);
router.post('/', authorize('admin', 'manager', 'receptionist'), validate(createSchema), ClientController.create);
router.put('/:id', authorize('admin', 'manager', 'receptionist'), validate(updateSchema), ClientController.update);
router.delete('/:id', authorize('admin', 'manager'), ClientController.delete);

module.exports = router;
