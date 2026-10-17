const Joi = require('joi');
const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((value,helpers)=> {
  const parsed=new Date(`${value}T00:00:00Z`);
  return Number(value.slice(0,4))>0 && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10)===value ? value : helpers.error('any.invalid');
});
const stay = {check_in:date.required(),check_out:date.required(),adults:Joi.number().integer().min(1).max(20).default(1),children:Joi.number().integer().min(0).max(19).default(0)};
const availabilitySchema=Joi.object({...stay,page:Joi.number().integer().min(1).max(100000).default(1),pageSize:Joi.number().integer().min(1).max(100).default(12)});
const bookingSchema=Joi.object({...stay,room_id:Joi.number().integer().positive().required(),
  expected_total:Joi.number().min(0).max(99999999.99).precision(2).strict().required(),
  expected_currency:Joi.string().valid('BOB','USD','EUR').required(),arrival_time:Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).allow('').default(''),special_requests:Joi.string().trim().max(1000).allow('').default('')});
module.exports={availabilitySchema,bookingSchema};
