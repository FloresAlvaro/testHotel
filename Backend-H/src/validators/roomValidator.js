const Joi=require('joi');
const id=Joi.number().integer().positive().max(2147483647);
const fields={number:Joi.string().trim().min(1).max(20),room_type_id:id,floor:Joi.number().integer().min(0).max(2147483647),status:Joi.string().valid('available','reserved','occupied','maintenance')};
const typeFields={name:Joi.string().trim().min(1).max(100),description:Joi.string().max(5000).allow('',null),price:Joi.number().positive().max(99999999.99).precision(2).strict(),capacity:Joi.number().integer().positive().max(2147483647).strict(),amenities:Joi.string().max(500).allow('',null),image:Joi.string().max(500).uri({scheme:['http','https'],allowRelative:true}).allow('',null)};
module.exports={
 roomCreate:Joi.object({...fields,number:fields.number.required(),room_type_id:id.required(),status:Joi.forbidden()}),
 roomUpdate:Joi.object(fields).min(1),
 roomStatus:Joi.object({status:fields.status.required()}),
 typeCreate:Joi.object({...typeFields,name:typeFields.name.required(),price:typeFields.price.required(),capacity:typeFields.capacity.required()}),
 typeUpdate:Joi.object(typeFields).min(1),
 id:Joi.object({id:id.required()}),floor:Joi.object({floor:Joi.number().integer().min(0).max(2147483647).required()}),
 dates:Joi.object({checkIn:Joi.string().isoDate().required(),checkOut:Joi.string().isoDate().required(),roomTypeId:id})
};
