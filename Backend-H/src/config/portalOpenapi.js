const security=[{bearerAuth:[]}];
const id={name:'id',in:'path',required:true,schema:{type:'integer',minimum:1}};
const operation=(summary,description,parameters=[],body)=>({
  tags:['Guest portal'],security,summary,description,parameters,
  ...(body?{requestBody:{required:true,content:{'application/json':{schema:body}}}}:{}),
  responses:{200:{description:'Respuesta success/data; reservas incluyen pagination'},201:{description:'Registro creado'},400:{description:'Datos no válidos'},401:{description:'Autenticación requerida'},403:{description:'Rol no autorizado o acceso desactivado'},404:{description:'Registro inexistente o perteneciente a otro huésped'},409:{description:'Conflicto de disponibilidad, tarifa o registro existente'},422:{description:'Datos de entrada no válidos'}}
});
module.exports={
 '/api/portal/hotel':{get:operation('Información del hotel','Solo customer. Nombre, contacto, moneda, zona horaria y horarios; no da acceso a la configuración administrativa.')},
 '/api/portal/availability':{get:operation('Consultar habitaciones disponibles','Solo customer. Fechas del hotel, 1 a 365 noches; excluye mantenimiento, tareas abiertas y reservas solapadas. Devuelve habitaciones paginadas, tarifa por noche, total, noches y moneda.',[
  {name:'check_in',in:'query',required:true,schema:{type:'string',format:'date'}},{name:'check_out',in:'query',required:true,schema:{type:'string',format:'date'}},
  {name:'adults',in:'query',schema:{type:'integer',minimum:1,maximum:20,default:1}},{name:'children',in:'query',schema:{type:'integer',minimum:0,maximum:19,default:0}},{name:'page',in:'query',schema:{type:'integer',minimum:1,default:1}},{name:'pageSize',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:12}}
 ])},
 '/api/portal/profile':{get:operation('Mi perfil de huésped','Solo customer. Nombre, correo y teléfono de la ficha vinculada.')},
 '/api/portal/next-stay':{get:operation('Mi estancia actual o próxima','Solo customer. Devuelve la estancia activa o la próxima confirmada, o null.')},
 '/api/portal/reservations':{post:operation('Confirmar mi reserva','Solo customer. Revalida disponibilidad y tarifa en una transacción. Vincula la ficha autenticada y calcula el total en servidor. No acepta client_id, user_id, status ni total_price. Una reserva confirmada no registra un pago.',[],{type:'object',additionalProperties:false,required:['check_in','check_out','room_id','expected_total','expected_currency'],properties:{check_in:{type:'string',format:'date'},check_out:{type:'string',format:'date'},room_id:{type:'integer',minimum:1},adults:{type:'integer',minimum:1,maximum:20,default:1},children:{type:'integer',minimum:0,maximum:19,default:0},arrival_time:{type:'string',description:'Opcional HH:MM'},special_requests:{type:'string',maxLength:1000},expected_total:{type:'number',minimum:0},expected_currency:{type:'string',enum:['BOB','USD','EUR']}}}),get:operation('Mis reservas','Solo customer. Vinculación obtenida de la base de datos; no acepta client_id.',[
  {name:'page',in:'query',schema:{type:'integer',minimum:1,maximum:100000,default:1}},
  {name:'pageSize',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:10}},
  {name:'status',in:'query',schema:{type:'string',enum:['confirmed','checked_in','checked_out','cancelled']}}
 ])},
 '/api/portal/reservations/{id}':{get:operation('Detalle de mi reserva','Solo customer. Incluye pagos propios y disponibilidad de comprobante. Omite notas internas y usuarios del personal.',[id])},
 '/api/portal/receipts/{id}':{get:operation('Mi comprobante por ID de pago','Solo customer. Comprueba pertenencia de la reserva en SQL. Devuelve instantánea pública, estado actual y marca histórica; excluye notas, referencias bancarias y emisor interno.',[id])},
 '/api/clients/{id}/account':{
  get:operation('Consultar acceso del huésped','Solo admin. Devuelve cuenta vinculada o null; nunca devuelve contraseña.',[id]),
  post:operation('Crear acceso del huésped','Solo admin. Una cuenta por ficha activa; no emite token ni envía correo. Rol customer fijado en servidor; no acepta role ni client_id en el cuerpo.',[id],{type:'object',additionalProperties:false,required:['email','password'],properties:{email:{type:'string',format:'email',maxLength:200},password:{type:'string',minLength:8,maxLength:72,description:'Máximo 72 bytes UTF-8'}}}),
  patch:operation('Activar o desactivar acceso','Solo admin. La desactivación se comprueba también en cada petición con un token existente.',[id],{type:'object',additionalProperties:false,required:['is_active'],properties:{is_active:{type:'boolean'}}})
 }
};
