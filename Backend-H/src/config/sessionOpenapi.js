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
  post:{...operation('Iniciar sesión de navegador',{input:'SessionLoginInput',output:'SessionResponse',publicAccess:true}),responses:{...operation('',{output:'SessionResponse'}).responses,202:{description:'Contraseña verificada; completar MFA sin credenciales de acceso',content:json(ref('MfaChallengeResponse'))}},description:'Requiere X-Hotel-Request: 1 y origen APP_URL. Emite hotel_session HttpOnly, SameSite=Lax, Secure en HTTPS; no devuelve credencial de sesión en JSON.'},
  get:{...operation('Recuperar perfil y CSRF de sesión',{output:'SessionResponse'}),security:[{cookieAuth:[]}]},
  delete:{...operation('Revocar sesión actual'),description:'Requiere X-Hotel-Request: 1 y X-Hotel-CSRF del GET /users/session.'}
 },
 '/api/users/mfa/enable':{post:operation('Activar MFA propio opcional (solo admin)',{input:'MfaEnableInput',output:'MfaChallengeResponse'})},
 '/api/users/mfa/disable':{post:operation('Desactivar MFA propio con contraseña y factor (solo admin)',{input:'MfaRenewInput',output:'MfaCompletionResponse'})},
 '/api/users/mfa/status':{get:operation('Estado MFA propio',{output:'MfaStatusResponse'})},
 '/api/users/mfa/renew':{post:operation('Reautenticar con contraseña y factor para renovar TOTP y recuperación',{input:'MfaRenewInput',output:'MfaChallengeResponse'})},
 '/api/users/mfa/enroll':{post:operation('Preparar TOTP y diez códigos de recuperación tras contraseña verificada',{input:'MfaChallengeInput',output:'MfaEnrollmentResponse',publicAccess:true})},
 '/api/users/mfa/confirm':{post:operation('Confirmar TOTP y guardado de recuperación; emitir sesión',{input:'MfaConfirmInput',output:'MfaCompletionResponse',publicAccess:true})},
 '/api/users/mfa/verify':{post:operation('Verificar TOTP o código de recuperación de un solo uso; emitir sesión',{input:'MfaVerifyInput',output:'MfaCompletionResponse',publicAccess:true})},
 '/api/users/sessions':{get:{...operation('Listar las sesiones propias vigentes',{output:'OwnSessionsResponse'}),description:'Máximo 100. Devuelve identificadores públicos y fechas, nunca credenciales, hashes o CSRF de otras sesiones.'}},
 '/api/users/sessions/{sessionId}':{delete:{...operation('Revocar una sesión propia'),description:'Solo del usuario autenticado. Cookie requiere CSRF; X-Hotel-Request: 1. Revocar la sesión actual exige volver a iniciar sesión.',parameters:[{name:'sessionId',in:'path',required:true,schema:{type:'string',format:'uuid'}}]}},
 '/api/users/invitations':{
  get:operation('Listar invitaciones (solo admin, máximo 100)'),
  post:operation('Invitar personal o huésped (solo admin)',{input:'InvitationInput',output:'InvitationResponse',status:201})
 },
 '/api/users/invitations/{id}':{delete:{...operation('Revocar invitación pendiente (solo admin)'),parameters:[{name:'id',in:'path',required:true,schema:{type:'integer',minimum:1}}]}},
 '/api/users/accept-invitation':{post:operation('Elegir contraseña y aceptar invitación de un solo uso',{input:'AcceptInvitationInput',publicAccess:true})}
};
