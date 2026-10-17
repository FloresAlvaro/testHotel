const Joi = require('joi');
const definitions = require('../../contracts/schemas.json');
// Subconjunto explícito: falla al agregar un esquema no soportado en vez de omitir reglas.
function schema(schema) {
 if(schema.$ref)return schemaByName(schema.$ref.split('/').pop());
 if(schema.anyOf)return Joi.alternatives().try(...schema.anyOf.map(item=>module.exports.schema(item)));
 let result;
 if(schema.type==='object'){
  const required=new Set(schema.required||[]);
  result=Joi.object(Object.fromEntries(Object.entries(schema.properties).map(([name,field])=>[name,required.has(name)?module.exports.schema(field).required():module.exports.schema(field)])));
 } else if(schema.type==='string') {
  result=Joi.string();
  if(schema['x-trim'])result=result.trim();
  if(schema['x-lowercase'])result=result.lowercase();
  if(schema.format==='email')result=result.email({tlds:false});
  if(schema.minLength!==undefined)result=result.min(schema.minLength);
  if(schema.maxLength!==undefined)result=result.max(schema.maxLength);
  if(schema.pattern)result=result.pattern(new RegExp(schema.pattern));
 } else if(schema.type==='integer')result=Joi.number().integer();
 else if(schema.type==='boolean')result=Joi.boolean();
 else throw new Error(`Tipo de contrato no soportado: ${schema.type}`);
 if(schema.minimum!==undefined)result=result.min(schema.minimum);
 if(schema.enum)result=result.valid(...schema.enum);
 if(schema.nullable)result=result.allow(null);
 return result;
}
function schemaByName(name) {if(!definitions[name])throw new Error(`Contrato no definido: ${name}`);return schema(definitions[name]);}
module.exports={schema,byName:schemaByName};
