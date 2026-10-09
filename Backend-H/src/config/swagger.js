/** @type {import('../types/openapi').Document} */
const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Hotel System API',
    version: '1.0.0',
    description:
      'API para la gestion de usuarios, clientes, habitaciones, reservas, check-in/check-out y pagos.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local',
    },
  ],
  tags: [
    { name: 'Health', description: 'Estado del servicio' },
    { name: 'Users', description: 'Autenticacion y usuarios' },
    { name: 'Clients', description: 'Clientes del hotel' },
    { name: 'Rooms', description: 'Habitaciones' },
    { name: 'Reservations', description: 'Reservas' },
    { name: 'Check-in', description: 'Entradas y salidas' },
    { name: 'Payments', description: 'Pagos' },
    { name: 'Dashboard', description: 'Indicadores del hotel' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Solicitud invalida' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      UserCredentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'usuario@hotel.com' },
          password: { type: 'string', minLength: 8, example: 'password123' },
        },
      },
      Client: {
        type: 'object',
        required: ['name', 'document'],
        properties: {
          name: { type: 'string', example: 'Ana Perez' },
          document: { type: 'string', example: '123456789' },
          document_type: {
            type: 'string',
            enum: ['cedula', 'passport', 'license', 'other'],
            example: 'cedula',
          },
          email: { type: 'string', format: 'email', example: 'ana@example.com' },
          phone: { type: 'string', example: '+57 3000000000' },
          address: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          nationality: { type: 'string' },
          date_of_birth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['M', 'F'] },
          emergency_contact: { type: 'string' },
          emergency_phone: { type: 'string' },
        },
      },
      Reservation: {
        type: 'object',
        required: ['check_in', 'check_out', 'client_id', 'room_id'],
        properties: {
          check_in: { type: 'string', format: 'date', example: '2026-10-01' },
          check_out: { type: 'string', format: 'date', example: '2026-10-03' },
          client_id: { type: 'integer', example: 1 },
          room_id: { type: 'integer', example: 2 },
          notes: { type: 'string' },
        },
      },
      Payment: {
        type: 'object',
        required: ['reservation_id', 'amount', 'method'],
        properties: {
          reservation_id: { type: 'integer', example: 1 },
          amount: { type: 'number', format: 'double', example: 250.5 },
          type: { type: 'string', enum: ['full', 'partial', 'advance'], example: 'partial' },
          method: {
            type: 'string',
            enum: ['cash', 'credit_card', 'debit_card', 'transfer', 'check'],
            example: 'cash',
          },
          transaction_id: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verificar estado de la API',
        responses: {
          200: { description: 'Servicio disponible' },
        },
      },
    },
    '/api/users/register': {
      post: {
        tags: ['Users'],
        summary: 'Registrar usuario de recepcion',
        security: [{ bearerAuth: [] }],
        description: 'Solo administradores pueden crear cuentas de empleados.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UserCredentials' } },
          },
        },
        responses: {
          201: { description: 'Usuario creado' },
          422: {
            description: 'Datos invalidos',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
    '/api/users/login': {
      post: {
        tags: ['Users'],
        summary: 'Iniciar sesion',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UserCredentials' } },
          },
        },
        responses: {
          200: { description: 'Token JWT generado' },
          401: { description: 'Credenciales invalidas' },
        },
      },
    },
    '/api/users/profile': {
      get: {
        tags: ['Users'],
        summary: 'Obtener perfil actual',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Perfil del usuario' },
          401: { description: 'No autenticado' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Obtener usuario por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Usuario encontrado' },
          404: { description: 'Usuario no encontrado' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Actualizar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['admin', 'receptionist', 'manager'] },
                  is_active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Usuario actualizado' },
          403: { description: 'Sin permisos' },
          404: { description: 'Usuario no encontrado' },
        },
      },
    },
    '/api/users/{id}/password': {
      patch: {
        tags: ['Users'],
        summary: 'Cambiar contraseña',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword', 'confirmPassword'],
                properties: {
                  currentPassword: { type: 'string', minLength: 8 },
                  newPassword: { type: 'string', minLength: 8 },
                  confirmPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Contraseña actualizada' },
          403: { description: 'Sin permisos' },
          422: { description: 'Datos invalidos' },
        },
      },
    },
    '/api/users/{id}/deactivate': {
      patch: {
        tags: ['Users'],
        summary: 'Desactivar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Usuario desactivado' },
          403: { description: 'Sin permisos' },
          404: { description: 'Usuario no encontrado' },
        },
      },
    },
    '/api/users/{id}/activate': {
      patch: {
        tags: ['Users'],
        summary: 'Activar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Usuario activado' },
          403: { description: 'Sin permisos' },
          404: { description: 'Usuario no encontrado' },
        },
      },
    },
    '/api/clients': {
      get: {
        tags: ['Clients'],
        summary: 'Listar clientes',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de clientes' } },
      },
      post: {
        tags: ['Clients'],
        summary: 'Crear cliente',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } },
        },
        responses: {
          201: { description: 'Cliente creado' },
          422: { description: 'Datos invalidos' },
        },
      },
    },
    '/api/clients/{id}': {
      put: {
        tags: ['Clients'],
        summary: 'Actualizar cliente',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  country: { type: 'string' },
                  emergency_contact: { type: 'string' },
                  emergency_phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Cliente actualizado' },
          404: { description: 'Cliente no encontrado' },
          422: { description: 'Datos invalidos' },
        },
      },
      delete: {
        tags: ['Clients'],
        summary: 'Eliminar cliente',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Cliente eliminado' },
          403: { description: 'Sin permisos' },
          404: { description: 'Cliente no encontrado' },
        },
      },
    },
    '/api/rooms': {
      get: {
        tags: ['Rooms'],
        summary: 'Listar habitaciones',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de habitaciones' } },
      },
      post: {
        tags: ['Rooms'],
        summary: 'Crear habitacion',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Habitacion creada' },
          403: { description: 'Sin permisos' },
        },
      },
    },
    '/api/rooms/{id}': {
      put: {
        tags: ['Rooms'],
        summary: 'Actualizar habitación',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  number: { type: 'string' },
                  room_type_id: { type: 'integer' },
                  floor: { type: 'integer' },
                  status: {
                    type: 'string',
                    enum: ['available', 'reserved', 'occupied', 'maintenance'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Habitación actualizada' },
          404: { description: 'Habitación no encontrada' },
          409: { description: 'Transición de estado no permitida' },
        },
      },
    },
    '/api/rooms/{id}/status': {
      patch: {
        tags: ['Rooms'],
        summary: 'Actualizar estado de habitación',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['available', 'reserved', 'occupied', 'maintenance'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Estado actualizado' },
          404: { description: 'Habitación no encontrada' },
          409: { description: 'Transición de estado no permitida' },
        },
      },
    },
    '/api/room-types': {
      get: {
        tags: ['Rooms'],
        summary: 'Listar tipos de habitación',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de tipos de habitación' } },
      },
      post: {
        tags: ['Rooms'],
        summary: 'Crear tipo de habitación',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'price', 'capacity'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number', minimum: 0, exclusiveMinimum: true },
                  capacity: { type: 'integer', minimum: 1 },
                  amenities: { type: 'array', items: { type: 'string' } },
                  image: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Tipo de habitación creado' },
          403: { description: 'Sin permisos' },
          409: { description: 'El tipo ya existe' },
        },
      },
    },
    '/api/room-types/{id}': {
      get: {
        tags: ['Rooms'],
        summary: 'Obtener tipo de habitación por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Tipo de habitación encontrado' },
          404: { description: 'Tipo no encontrado' },
        },
      },
      put: {
        tags: ['Rooms'],
        summary: 'Actualizar tipo de habitación',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number' },
                  capacity: { type: 'integer' },
                  amenities: { type: 'array', items: { type: 'string' } },
                  image: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Tipo de habitación actualizado' },
          403: { description: 'Sin permisos' },
          404: { description: 'Tipo no encontrado' },
        },
      },
    },
    '/api/room-types/{id}/deactivate': {
      patch: {
        tags: ['Rooms'],
        summary: 'Desactivar tipo de habitación',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Tipo de habitación desactivado' },
          403: { description: 'Sin permisos' },
          404: { description: 'Tipo no encontrado' },
        },
      },
    },
    '/api/rooms/available-for-dates': {
      get: {
        tags: ['Rooms'],
        summary: 'Consultar habitaciones disponibles por fechas',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'checkIn',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'checkOut',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
          },
          { name: 'roomTypeId', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Habitaciones disponibles' } },
      },
    },
    '/api/reservations': {
      get: {
        tags: ['Reservations'],
        summary: 'Listar reservas',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de reservas' } },
      },
      post: {
        tags: ['Reservations'],
        summary: 'Crear reserva',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Reservation' } } },
        },
        responses: {
          201: { description: 'Reserva creada' },
          409: { description: 'Habitacion no disponible' },
        },
      },
    },
    '/api/reservations/{id}': {
      put: {
        tags: ['Reservations'],
        summary: 'Actualizar reserva',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  check_in: { type: 'string', format: 'date' },
                  check_out: { type: 'string', format: 'date' },
                  total_price: { type: 'number', minimum: 0 },
                  status: {
                    type: 'string',
                    enum: ['confirmed', 'checked_in', 'checked_out', 'cancelled'],
                  },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Reserva actualizada' },
          404: { description: 'Reserva no encontrada' },
          409: { description: 'Estado o fechas no permitidos' },
          422: { description: 'Datos invalidos' },
        },
      },
    },
    '/api/reservations/{id}/cancel': {
      patch: {
        tags: ['Reservations'],
        summary: 'Cancelar reserva',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Reserva cancelada' },
          409: { description: 'Transicion no permitida' },
        },
      },
    },
    '/api/check-in': {
      post: {
        tags: ['Check-in'],
        summary: 'Registrar check-in',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Check-in registrado' },
          409: { description: 'Estado no permitido' },
        },
      },
    },
    '/api/check-in/check-out': {
      post: {
        tags: ['Check-in'],
        summary: 'Registrar check-out',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Check-out registrado' },
          409: { description: 'Estado no permitido' },
        },
      },
    },
    '/api/payments': {
      get: {
        tags: ['Payments'],
        summary: 'Listar pagos',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de pagos' } },
      },
      post: {
        tags: ['Payments'],
        summary: 'Crear pago',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Payment' } } },
        },
        responses: {
          200: { description: 'Pago registrado' },
          422: { description: 'Datos invalidos' },
        },
      },
    },
    '/api/payments/{id}/status': {
      patch: {
        tags: ['Payments'],
        summary: 'Actualizar estado de pago',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Estado del pago actualizado' },
          403: { description: 'Sin permisos' },
          404: { description: 'Pago no encontrado' },
        },
      },
    },
    '/api/payments/{id}/complete': {
      patch: {
        tags: ['Payments'],
        summary: 'Completar pago',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Pago completado' },
          403: { description: 'Sin permisos' },
          404: { description: 'Pago no encontrado' },
          409: { description: 'Estado no permitido' },
        },
      },
    },
    '/api/payments/{id}/refund': {
      patch: {
        tags: ['Payments'],
        summary: 'Reembolsar pago',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Pago reembolsado' },
          403: { description: 'Sin permisos' },
          404: { description: 'Pago no encontrado' },
          409: { description: 'Estado no permitido' },
        },
      },
    },
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Obtener resumen del dashboard',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: { description: 'Indicadores del hotel' },
          403: { description: 'Solo admin o manager' },
        },
      },
    },
  },
};

const { components, paths } = swaggerSpec;
const schemas = require('./apiSchemas.json');
Object.assign(components.schemas, schemas);
const fromJoi = require('./joiSchema');
const requestModels = [
  ['user', 'registerSchema', 'RegisterRequest'],
  ['user', 'loginSchema', 'LoginRequest'],
  ['user', 'changePasswordSchema', 'ChangePasswordRequest'],
  ['user', 'updateSchema', 'UpdateUserRequest'],
  ['client', 'createSchema', 'CreateClientRequest'],
  ['client', 'updateSchema', 'UpdateClientRequest'],
  ['room', 'createSchema', 'CreateRoomRequest'],
  ['room', 'updateSchema', 'UpdateRoomRequest'],
  ['roomType', 'createSchema', 'CreateRoomTypeRequest'],
  ['roomType', 'updateSchema', 'UpdateRoomTypeRequest'],
  ['reservation', 'createSchema', 'CreateReservationRequest'],
  ['reservation', 'updateSchema', 'UpdateReservationRequest'],
  ['payment', 'createSchema', 'CreatePaymentRequest'],
  ['payment', 'updateSchema', 'UpdatePaymentRequest'],
  ['payment', 'updateStatusSchema', 'PaymentStatusRequest'],
  ['account', 'inviteSchema', 'InviteRequest'],
  ['account', 'consumeSchema', 'PasswordTokenRequest'],
  ['account', 'resetSchema', 'ForgotPasswordRequest'],
];
for (const [module, field, name] of requestModels)
  components.schemas[name] = fromJoi(require(`../validators/${module}Validator`)[field]);
const ref = (name) => ({ $ref: '#/components/schemas/' + name });
/** @param {string} name @returns {import('../types/openapi').Response} */
const response = (name) => ({
  description: 'Operación exitosa',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['success', 'message', 'data'],
        properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: ref(name) },
      },
    },
  },
});
const account = (method, summary, requestSchema, dataSchema, secured = false) => ({
  [method]: {
    tags: ['Users'],
    summary,
    ...(secured ? { security: [{ bearerAuth: [] }, { cookieAuth: [] }] } : {}),
    ...(requestSchema
      ? {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref(requestSchema) } },
          },
        }
      : {}),
    responses: {
      200: dataSchema ? response(dataSchema) : { description: 'Operación exitosa' },
      401: { description: 'Sesión inválida' },
      422: { description: 'Datos inválidos' },
    },
  },
});
components.securitySchemes.cookieAuth = {
  type: 'apiKey',
  in: 'cookie',
  name: 'hotel_session',
};
Object.assign(paths, {
  '/api/account/invitations': account(
    'post',
    'Invitar empleado (solo admin)',
    'InviteRequest',
    'Invitation',
    true,
  ),
  '/api/account/accept-invitation': account(
    'post',
    'Activar cuenta con enlace de un solo uso',
    'PasswordTokenRequest',
  ),
  '/api/account/forgot-password': account(
    'post',
    'Solicitar recuperación por correo',
    'ForgotPasswordRequest',
  ),
  '/api/account/reset-password': account('post', 'Restablecer contraseña', 'PasswordTokenRequest'),
  '/api/account/sessions': account('get', 'Listar sesiones propias', null, null, true),
  '/api/account/sessions/{sessionId}': {
    ...account('delete', 'Revocar una sesión propia', null, null, true),
    parameters: [
      { name: 'sessionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
    ],
  },
  '/api/account/logout': account('post', 'Cerrar sesión actual', null, null, true),
  '/api/account/logout-all': account('post', 'Cerrar todas las sesiones propias', null, null, true),
});
paths['/api/users/login'].post.responses[200] = response('LoginResponse');
paths['/api/users/login'].post.requestBody.content['application/json'].schema = ref('LoginRequest');
paths['/api/users/register'].post.requestBody.content['application/json'].schema =
  ref('RegisterRequest');
paths['/api/account/invitations'].post.responses[201] = response('Invitation');
delete paths['/api/account/invitations'].post.responses[200];
paths['/api/account/sessions'].get.responses[200] = response('Session');
paths['/api/account/sessions'].get.responses[200].content[
  'application/json'
].schema.properties.data = { type: 'array', items: ref('Session') };
paths['/api/users/register'].post.deprecated = true;
/** @type {Array<'get' | 'post' | 'put' | 'patch' | 'delete'>} */
const methods = ['get', 'post', 'put', 'patch', 'delete'];
for (const item of Object.values(paths))
  for (const method of methods) {
    const op = item[method];
    if (!op || typeof op !== 'object') continue;
    if (op.security) op.security = [{ bearerAuth: [] }, { cookieAuth: [] }];
    const schema = op.requestBody?.content?.['application/json']?.schema;
    if (schema?.$ref) {
      const map = {
        Client: 'CreateClientRequest',
        Reservation: 'CreateReservationRequest',
        Payment: 'CreatePaymentRequest',
      };
      const name = schema.$ref.split('/').pop();
      if (map[name]) schema.$ref = '#/components/schemas/' + map[name];
    }
  }
components.schemas.Error.properties.requestId = { type: 'string', format: 'uuid' };
components.schemas.Error.required = ['success', 'message', 'requestId'];
paths['/api/payments/{id}'] = {
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
  get: {
    tags: ['Payments'],
    summary: 'Obtener pago',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: { 200: response('Payment') },
  },
  put: {
    tags: ['Payments'],
    summary: 'Actualizar pago pendiente',
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    responses: { 200: response('Payment') },
  },
};
for (const [path, method, name] of [
  ['/api/users/{id}', 'put', 'UpdateUserRequest'],
  ['/api/users/{id}/password', 'patch', 'ChangePasswordRequest'],
  ['/api/clients', 'post', 'CreateClientRequest'],
  ['/api/clients/{id}', 'put', 'UpdateClientRequest'],
  ['/api/rooms', 'post', 'CreateRoomRequest'],
  ['/api/rooms/{id}', 'put', 'UpdateRoomRequest'],
  ['/api/room-types', 'post', 'CreateRoomTypeRequest'],
  ['/api/room-types/{id}', 'put', 'UpdateRoomTypeRequest'],
  ['/api/reservations', 'post', 'CreateReservationRequest'],
  ['/api/reservations/{id}', 'put', 'UpdateReservationRequest'],
  ['/api/payments', 'post', 'CreatePaymentRequest'],
  ['/api/payments/{id}', 'put', 'UpdatePaymentRequest'],
  ['/api/payments/{id}/status', 'patch', 'PaymentStatusRequest'],
]) {
  const operation = paths[path]?.[method];
  if (!operation) throw new Error(`Falta documentación para ${method} ${path}`);
  operation.requestBody = {
    required: true,
    content: { 'application/json': { schema: ref(name) } },
  };
}
const readEndpoints = /** @type {Array<[string, string, (string | null)?, boolean?]>} */ ([
  ['/api/users', 'Listar empleados (solo admin)', 'User', true],
  ['/api/users/search', 'Buscar empleados (solo admin)', 'User', true],
  ['/api/clients/search', 'Buscar huéspedes', 'Client', true],
  ['/api/clients/{id}', 'Obtener huésped', 'Client'],
  ['/api/clients/{id}/reservations', 'Historial de reservas del huésped', 'Reservation', true],
  ['/api/clients/{id}/stats', 'Estadísticas del huésped'],
  ['/api/rooms/available', 'Habitaciones disponibles', 'Room', true],
  ['/api/rooms/occupancy', 'Estado de ocupación'],
  ['/api/rooms/floor/{floor}', 'Habitaciones por piso', 'Room', true],
  ['/api/rooms/{id}', 'Obtener habitación', 'Room'],
  ['/api/room-types/{id}/availability', 'Disponibilidad por tipo de habitación'],
  ['/api/reservations/active', 'Reservas activas', 'Reservation', true],
  ['/api/reservations/upcoming', 'Próximas reservas', 'Reservation', true],
  ['/api/reservations/client/{clientId}', 'Reservas del huésped', 'Reservation', true],
  ['/api/reservations/{id}', 'Obtener reserva', 'Reservation'],
  ['/api/payments/pending', 'Pagos pendientes', 'Payment', true],
  ['/api/payments/revenue/period', 'Ingresos por período', null, true],
  ['/api/payments/revenue/method', 'Ingresos por método de pago', null, true],
  ['/api/payments/reservation/{reservationId}', 'Pagos de la reserva', 'Payment', true],
  ['/api/check-in/today', 'Ingresos de hoy', 'CheckInLogData', true],
  ['/api/check-in/pending-check-outs', 'Salidas pendientes', 'CheckInLogData', true],
  [
    '/api/check-in/reservation/{reservationId}',
    'Registro de ingreso de la reserva',
    'CheckInLogData',
  ],
  [
    '/api/check-in/client/{clientId}/history',
    'Historial de ingresos del huésped',
    'CheckInLogData',
    true,
  ],
]);
for (const [path, summary, model, list] of readEndpoints) {
  const result = response(model || 'User');
  result.content['application/json'].schema.properties.data = model
    ? list
      ? { type: 'array', items: ref(model) }
      : ref(model)
    : {
        type: 'object',
        additionalProperties: true,
        description: 'Estadísticas agregadas específicas del endpoint.',
      };
  if (!model && list)
    result.content['application/json'].schema.properties.data = {
      type: 'array',
      items: { type: 'object', additionalProperties: true },
    };
  if (path === '/api/users')
    result.content['application/json'].schema.properties.pagination = ref('ApiPagination');
  const item = paths[path] || (paths[path] = {});
  item.get = {
    summary,
    tags: [path.split('/')[2]],
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    parameters: [...path.matchAll(/\{(\w+)\}/g)].map(([, name]) => ({
      name,
      in: 'path',
      required: true,
      schema: { type: 'integer', minimum: name === 'floor' ? 0 : 1 },
    })),
    responses: {
      200: result,
      401: { description: 'Sesión inválida' },
      403: { description: 'Sin permisos' },
      404: { description: 'Registro no encontrado' },
    },
  };
}
const errorResponse = {
  description: 'Error de la solicitud',
  content: { 'application/json': { schema: ref('Error') } },
};
for (const item of Object.values(paths))
  for (const method of methods) {
    const operation = item[method];
    if (!operation) continue;
    operation.responses = {
      ...operation.responses,
      429: { ...errorResponse, description: 'Límite de solicitudes excedido' },
    };
    for (const code of [400, 401, 403, 404, 409, 422, 500])
      operation.responses[code] = { ...errorResponse, ...operation.responses[code] };
  }
module.exports = swaggerSpec;
