const ref=name=>({$ref:`#/components/schemas/${name}`});
const json=schema=>({'application/json':{schema}});
const operation=(summary,{input,output,publicAccess=false,status=200}={})=>({
 tags:['Sessions and invitations'],summary,
 security:publicAccess?[]:[{cookieAuth:[]},{bearerAuth:[]}],
 ...(input?{requestBody:{required:true,content:json(ref(input))}}:{}),
 responses:{[status]:{description:'Operación completada',...(output?{content:json(ref(output))}:{})},400:{description:'Entrada o enlace no válido'},401:{description:'Sesión vencida'},403:{description:'Rol, origen o CSRF no autorizado'},409:{description:'Cuenta existente'},503:{description:'Servicio no configurado'}}
});
module.exports={
 '/api/users/session':{
  post:{...operation('Iniciar sesión de navegador',{input:'SessionLoginInput',output:'SessionResponse',publicAccess:true}),description:'Requiere X-Hotel-Request: 1 y origen APP_URL. Emite hotel_session HttpOnly, SameSite=Lax, Secure en HTTPS; no devuelve credencial de sesión en JSON.'},
  get:{...operation('Recuperar perfil y CSRF de sesión',{output:'SessionResponse'}),security:[{cookieAuth:[]}]},
  delete:{...operation('Revocar sesión actual'),description:'Requiere X-Hotel-Request: 1 y X-Hotel-CSRF del GET /users/session.'}
 },
 '/api/users/invitations':{
  get:operation('Listar invitaciones (solo admin, máximo 100)'),
  post:operation('Invitar personal o huésped (solo admin)',{input:'InvitationInput',output:'InvitationResponse',status:201})
 },
 '/api/users/invitations/{id}':{delete:{...operation('Revocar invitación pendiente (solo admin)'),parameters:[{name:'id',in:'path',required:true,schema:{type:'integer',minimum:1}}]}},
 '/api/users/accept-invitation':{post:operation('Elegir contraseña y aceptar invitación de un solo uso',{input:'AcceptInvitationInput',publicAccess:true})}
};
