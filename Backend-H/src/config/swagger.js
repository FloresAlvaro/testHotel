const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Hotel System API',
    version: '1.0.0',
    description: 'API para la gestion de usuarios, clientes, habitaciones, reservas, check-in/check-out y pagos.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local'
    }
  ],
  tags: [
    { name: 'Health', description: 'Estado del servicio' },
    { name: 'Users', description: 'Autenticacion y usuarios' },
    { name: 'Clients', description: 'Clientes del hotel' },
    { name: 'Rooms', description: 'Habitaciones' },
    { name: 'Reservations', description: 'Reservas' },
    { name: 'Check-in', description: 'Entradas y salidas' },
    { name: 'Payments', description: 'Pagos' },
    { name: 'Dashboard', description: 'Indicadores del hotel' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Solicitud invalida' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      UserCredentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'usuario@hotel.com' },
          password: { type: 'string', minLength: 8, example: 'password123' }
        }
      },
      Client: {
        type: 'object',
        required: ['name', 'document'],
        properties: {
          name: { type: 'string', example: 'Ana Perez' },
          document: { type: 'string', example: '123456789' },
          document_type: { type: 'string', enum: ['cedula', 'passport', 'license', 'other'], example: 'cedula' },
          email: { type: 'string', format: 'email', example: 'ana@example.com' },
          phone: { type: 'string', example: '+57 3000000000' },
          address: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          nationality: { type: 'string' },
          date_of_birth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['M', 'F'] },
          emergency_contact: { type: 'string' },
          emergency_phone: { type: 'string' }
        }
      },
      Reservation: {
        type: 'object',
        required: ['check_in', 'check_out', 'client_id', 'room_id'],
        properties: {
          check_in: { type: 'string', format: 'date', example: '2026-10-01' },
          check_out: { type: 'string', format: 'date', example: '2026-10-03' },
          client_id: { type: 'integer', example: 1 },
          room_id: { type: 'integer', example: 2 },
          notes: { type: 'string' }
        }
      },
      Payment: {
        type: 'object',
        required: ['reservation_id', 'amount', 'method'],
        properties: {
          reservation_id: { type: 'integer', example: 1 },
          amount: { type: 'number', format: 'double', example: 250.5 },
          type: { type: 'string', enum: ['full', 'partial', 'advance'], example: 'partial' },
          method: { type: 'string', enum: ['cash', 'credit_card', 'debit_card', 'transfer', 'check'], example: 'cash' },
          transaction_id: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verificar estado de la API',
        responses: {
          200: { description: 'Servicio disponible' }
        }
      }
    },
    '/api/users': {
      post: {
        tags: ['Users'],
        summary: 'Crear empleado (solo administrador)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', minLength: 2 }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8, maxLength: 72, description: 'Máximo 72 bytes UTF-8' }, role: { type: 'string', enum: ['admin', 'manager', 'receptionist'], default: 'receptionist' } } } } } },
        responses: { 201: { description: 'Empleado creado sin token de sesión' }, 401: { description: 'No autenticado' }, 403: { description: 'Solo administrador' }, 409: { description: 'Email registrado' }, 422: { description: 'Datos invalidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } }
      }
    },
    '/api/users/register': {
      post: {
        tags: ['Users'],
        summary: 'Crear empleado (solo administrador)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', minLength: 2 }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8, maxLength: 72, description: 'Máximo 72 bytes UTF-8' }, role: { type: 'string', enum: ['admin', 'manager', 'receptionist'], default: 'receptionist' } } } } } },
        responses: { 201: { description: 'Empleado creado sin token de sesión' }, 401: { description: 'No autenticado' }, 403: { description: 'Solo administrador' }, 409: { description: 'Email registrado' }, 422: { description: 'Datos invalidos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } } }
      }
    },
    '/api/users/login': {
      post: {
        tags: ['Users'],
        summary: 'Iniciar sesion',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCredentials' } } } },
        responses: { 200: { description: 'Token JWT generado' }, 401: { description: 'Credenciales invalidas' } }
      }
    },
    '/api/users/profile': {
      get: {
        tags: ['Users'],
        summary: 'Obtener perfil actual',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Perfil del usuario' }, 401: { description: 'No autenticado' } }
      }
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Obtener usuario por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Usuario encontrado' }, 404: { description: 'Usuario no encontrado' } }
      },
      put: {
        tags: ['Users'],
        summary: 'Actualizar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', minProperties: 1, properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['admin', 'receptionist', 'manager'] }, is_active: { type: 'boolean' } } } } } },
        responses: { 200: { description: 'Usuario actualizado' }, 403: { description: 'Sin permisos' }, 404: { description: 'Usuario no encontrado' } }
      }
    },
    '/api/users/{id}/password': {
      patch: {
        tags: ['Users'],
        summary: 'Cambiar contraseña',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword', 'confirmPassword'], properties: { currentPassword: { type: 'string', minLength: 8 }, newPassword: { type: 'string', minLength: 8 }, confirmPassword: { type: 'string', minLength: 8 } } } } } },
        responses: { 200: { description: 'Contraseña actualizada' }, 403: { description: 'Sin permisos' }, 422: { description: 'Datos invalidos' } }
      }
    },
    '/api/users/{id}/deactivate': {
      patch: {
        tags: ['Users'],
        summary: 'Desactivar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Usuario desactivado' }, 403: { description: 'Sin permisos' }, 404: { description: 'Usuario no encontrado' } }
      }
    },
    '/api/users/{id}/activate': {
      patch: {
        tags: ['Users'],
        summary: 'Activar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Usuario activado' }, 403: { description: 'Sin permisos' }, 404: { description: 'Usuario no encontrado' } }
      }
    },
    '/api/clients': {
      get: {
        tags: ['Clients'],
        summary: 'Listar clientes',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de clientes' } }
      },
      post: {
        tags: ['Clients'],
        summary: 'Crear cliente',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } },
        responses: { 201: { description: 'Cliente creado' }, 422: { description: 'Datos invalidos' } }
      }
    },
    '/api/clients/{id}': {
      put: {
        tags: ['Clients'],
        summary: 'Actualizar cliente',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', minProperties: 1, properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, phone: { type: 'string' }, address: { type: 'string' }, city: { type: 'string' }, country: { type: 'string' }, emergency_contact: { type: 'string' }, emergency_phone: { type: 'string' } } } } } },
        responses: { 200: { description: 'Cliente actualizado' }, 404: { description: 'Cliente no encontrado' }, 422: { description: 'Datos invalidos' } }
      },
      delete: {
        tags: ['Clients'],
        summary: 'Eliminar cliente',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Cliente eliminado' }, 403: { description: 'Sin permisos' }, 404: { description: 'Cliente no encontrado' } }
      }
    },
    '/api/rooms': {
      get: {
        tags: ['Rooms'],
        summary: 'Listar habitaciones',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de habitaciones' } }
      },
      post: {
        tags: ['Rooms'],
        summary: 'Crear habitacion',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Habitacion creada' }, 403: { description: 'Sin permisos' } }
      }
    },
    '/api/rooms/{id}': {
      put: {
        tags: ['Rooms'],
        summary: 'Actualizar habitación',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { number: { type: 'string' }, room_type_id: { type: 'integer' }, floor: { type: 'integer' }, status: { type: 'string', enum: ['available', 'reserved', 'occupied', 'maintenance'] } } } } } },
        responses: { 200: { description: 'Habitación actualizada' }, 404: { description: 'Habitación no encontrada' }, 409: { description: 'Transición de estado no permitida' } }
      }
    },
    '/api/rooms/{id}/status': {
      patch: {
        tags: ['Rooms'],
        summary: 'Actualizar estado de habitación',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['available', 'reserved', 'occupied', 'maintenance'] } } } } } },
        responses: { 200: { description: 'Estado actualizado' }, 404: { description: 'Habitación no encontrada' }, 409: { description: 'Transición de estado no permitida' } }
      }
    },
    '/api/room-types': {
      get: {
        tags: ['Rooms'],
        summary: 'Listar tipos de habitación',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de tipos de habitación' } }
      },
      post: {
        tags: ['Rooms'],
        summary: 'Crear tipo de habitación',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'price', 'capacity'], properties: { name: { type: 'string' }, description: { type: 'string' }, price: { type: 'number', minimum: 0, exclusiveMinimum: true }, capacity: { type: 'integer', minimum: 1 }, amenities: { type: 'array', items: { type: 'string' } }, image: { type: 'string' } } } } } },
        responses: { 201: { description: 'Tipo de habitación creado' }, 403: { description: 'Sin permisos' }, 409: { description: 'El tipo ya existe' } }
      }
    },
    '/api/room-types/{id}': {
      get: {
        tags: ['Rooms'],
        summary: 'Obtener tipo de habitación por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Tipo de habitación encontrado' }, 404: { description: 'Tipo no encontrado' } }
      },
      put: {
        tags: ['Rooms'],
        summary: 'Actualizar tipo de habitación',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, price: { type: 'number' }, capacity: { type: 'integer' }, amenities: { type: 'array', items: { type: 'string' } }, image: { type: 'string' } } } } } },
        responses: { 200: { description: 'Tipo de habitación actualizado' }, 403: { description: 'Sin permisos' }, 404: { description: 'Tipo no encontrado' } }
      }
    },
    '/api/room-types/{id}/deactivate': {
      patch: {
        tags: ['Rooms'],
        summary: 'Desactivar tipo de habitación',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Tipo de habitación desactivado' }, 403: { description: 'Sin permisos' }, 404: { description: 'Tipo no encontrado' } }
      }
    },
    '/api/rooms/available-for-dates': {
      get: {
        tags: ['Rooms'],
        summary: 'Consultar habitaciones disponibles por fechas',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'checkIn', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'checkOut', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'roomTypeId', in: 'query', schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'Habitaciones disponibles' } }
      }
    },
    '/api/reservations': {
      get: {
        tags: ['Reservations'],
        summary: 'Listar reservas',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de reservas' } }
      },
      post: {
        tags: ['Reservations'],
        summary: 'Crear reserva',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Reservation' } } } },
        responses: { 201: { description: 'Reserva creada' }, 409: { description: 'Habitacion no disponible' } }
      }
    },
    '/api/reservations/{id}': {
      put: {
        tags: ['Reservations'],
        summary: 'Actualizar reserva',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', minProperties: 1, properties: { check_in: { type: 'string', format: 'date' }, check_out: { type: 'string', format: 'date' }, total_price: { type: 'number', minimum: 0 }, status: { type: 'string', enum: ['confirmed', 'cancelled'] }, notes: { type: 'string' } } } } } },
        responses: { 200: { description: 'Reserva actualizada' }, 404: { description: 'Reserva no encontrada' }, 409: { description: 'Estado o fechas no permitidos' }, 422: { description: 'Datos invalidos' } }
      }
    },
    '/api/reservations/{id}/cancel': {
      patch: {
        tags: ['Reservations'],
        summary: 'Cancelar reserva',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Reserva cancelada' }, 409: { description: 'Transicion no permitida' } }
      }
    },
    '/api/check-in': {
      post: {
        tags: ['Check-in'],
        summary: 'Registrar check-in',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Check-in registrado' }, 409: { description: 'Estado no permitido' } }
      }
    },
    '/api/check-in/check-out': {
      post: {
        tags: ['Check-in'],
        summary: 'Registrar check-out',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Check-out registrado' }, 409: { description: 'Estado no permitido' } }
      }
    },
    '/api/payments': {
      get: {
        tags: ['Payments'],
        summary: 'Listar pagos',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de pagos' } }
      },
      post: {
        tags: ['Payments'],
        summary: 'Crear pago',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Payment' } } } },
        responses: { 200: { description: 'Pago registrado' }, 422: { description: 'Datos invalidos' } }
      }
    },
    '/api/payments/{id}/status': {
      patch: {
        tags: ['Payments'],
        summary: 'Actualizar estado de pago',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] } } } } } },
        responses: { 200: { description: 'Estado del pago actualizado' }, 403: { description: 'Sin permisos' }, 404: { description: 'Pago no encontrado' } }
      }
    },
    '/api/payments/{id}/complete': {
      patch: {
        tags: ['Payments'],
        summary: 'Completar pago',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Pago completado' }, 403: { description: 'Sin permisos' }, 404: { description: 'Pago no encontrado' }, 409: { description: 'Estado no permitido' } }
      }
    },
    '/api/payments/{id}/refund': {
      patch: {
        tags: ['Payments'],
        summary: 'Reembolsar pago',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Pago reembolsado' }, 403: { description: 'Sin permisos' }, 404: { description: 'Pago no encontrado' }, 409: { description: 'Estado no permitido' } }
      }
    },
    '/api/payments/revenue/period': {
      get: {
        tags: ['Payments'],
        summary: 'Ingresos por día: solo importes completados',
        description: 'Incluye ambos días del período según la zona horaria de la base de datos. La fecha final debe ser igual o posterior a la inicial.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } }
        ],
        responses: { 200: { description: 'Informe de ingresos' }, 400: { description: 'Período inválido' }, 401: { description: 'No autenticado' }, 403: { description: 'Solo admin o manager' } }
      }
    },
    '/api/payments/revenue/method': {
      get: {
        tags: ['Payments'],
        summary: 'Ingresos completados por método',
        description: 'Incluye ambos días del período según la zona horaria de la base de datos. La fecha final debe ser igual o posterior a la inicial.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string', format: 'date' } }
        ],
        responses: { 200: { description: 'Informe de ingresos' }, 400: { description: 'Período inválido' }, 401: { description: 'No autenticado' }, 403: { description: 'Solo admin o manager' } }
      }
    },
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Obtener resumen del dashboard',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: { 200: { description: 'Indicadores del hotel' }, 403: { description: 'Solo admin o manager' } }
      }
    }
  }
};

swaggerSpec.tags.push({name:'Operations',description:'Configuración, caja, comprobantes, calendario, tareas e historial'});
Object.assign(swaggerSpec.paths,require('./operationsOpenapi'));
swaggerSpec.tags.push({name:'Guest portal',description:'Portal privado de cada huésped y gestión de su acceso'});
Object.assign(swaggerSpec.paths,require('./portalOpenapi'));
swaggerSpec.tags.push({name:'Guest services',description:'Solicitudes, presentación, correo, recuperación, pagos y respaldos'});
Object.assign(swaggerSpec.paths,require('./guestServicesOpenapi'));
swaggerSpec.components.securitySchemes.cookieAuth={type:'apiKey',in:'cookie',name:'hotel_session',description:'Sesión de navegador. Operaciones de escritura requieren X-Hotel-CSRF.'};
Object.assign(swaggerSpec.components.schemas,require('../../contracts/schemas.json'));
Object.assign(swaggerSpec.paths,require('./sessionOpenapi'));
swaggerSpec.tags.push({name:'Sessions and invitations',description:'Sesiones revocables e invitaciones de un solo uso'});
for(const path of Object.values(swaggerSpec.paths))for(const operation of Object.values(path)){
 if(operation.security?.some(s=>s.bearerAuth)&&!operation.security.some(s=>s.cookieAuth))operation.security.push({cookieAuth:[]});
}
swaggerSpec.paths['/api/operations/backup-status'].get.responses[200]={description:'Estado local y externo',content:{'application/json':{schema:{type:'object',required:['success','data'],properties:{success:{type:'boolean'},data:{$ref:'#/components/schemas/BackupStatus'}}}}}};
const queryParameter=(name,schema)=>({name,in:'query',schema});
const tableParams=[queryParameter('page',{type:'integer',minimum:1,maximum:100000,default:1}),queryParameter('pageSize',{type:'integer',minimum:1,maximum:100,default:10}),queryParameter('q',{type:'string',maxLength:200,description:'Búsqueda en todo el conjunto, antes de paginar'}),queryParameter('startDate',{type:'string',format:'date'}),queryParameter('endDate',{type:'string',format:'date'})];
const statuses={clients:[],reservations:['confirmed','checked_in','checked_out','cancelled'],payments:['pending','completed','failed','refunded'],users:['active','inactive'],'operations/online-payments':['pending','paid','expired','refunded','refund_pending','failed'],'operations/email-status':['sent','queued','failed'],'operations/reservation-requests':['pending','approved','rejected']};
for(const [path,values] of Object.entries(statuses)){
 const op=swaggerSpec.paths[`/api/${path}`].get ||= {tags:[path==='users'?'Users':'Operations'],summary:'Listado paginado',security:[{bearerAuth:[]},{cookieAuth:[]}],responses:{}};
 op.parameters=[...tableParams,...(values.length?[queryParameter('status',{type:'string',enum:values})]:[])];
 op.description=(op.description||'')+' Listado paginado sin límite oculto de 100 registros. Los filtros se aplican antes de paginar. Fechas inclusivas en la zona horaria del hotel.';
 op.responses[200]={description:'Lista en data y total/page/pageSize/totalPages en pagination'+(path==='payments'?'; summary contiene los agregados de todos los resultados filtrados.':'')};
}
const methodParameter=queryParameter('method',{type:'string',enum:['cash','credit_card','debit_card','transfer','check']});
swaggerSpec.paths['/api/payments'].get.parameters.push(methodParameter);
swaggerSpec.paths['/api/payments'].get.responses[200].content={'application/json':{schema:{type:'object',required:['success','data','pagination','summary'],properties:{success:{type:'boolean'},data:{type:'array',items:{$ref:'#/components/schemas/Payment'}},pagination:{type:'object',required:['total','page','pageSize','totalPages'],properties:{total:{type:'integer'},page:{type:'integer'},pageSize:{type:'integer'},totalPages:{type:'integer'}}},summary:{$ref:'#/components/schemas/PaymentListSummary'}}}}};
swaggerSpec.paths['/api/reservations'].get.parameters.push(queryParameter('clientId',{type:'integer',minimum:1}));
swaggerSpec.paths['/api/users'].get.parameters.push(queryParameter('role',{type:'string',enum:['admin','manager','receptionist']}));
for(const path of ['period','method'])swaggerSpec.paths[`/api/payments/revenue/${path}`].get.parameters.push(methodParameter);
module.exports = swaggerSpec;
