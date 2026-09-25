# Sistema de gestion hotelera

Backend REST para administrar usuarios, clientes, habitaciones, reservas, entradas y salidas, pagos e indicadores del hotel. La API esta construida con Node.js, Express y PostgreSQL.

## Requisitos

- Docker y Docker Compose para ejecutar el stack completo.
- Node.js y npm para ejecutar el backend o sus pruebas localmente.
- PostgreSQL 16 si ejecutas la base de datos fuera de Docker.

## Inicio rapido con Docker

Desde la raiz del repositorio, crea el archivo de entorno que Compose necesita:

```powershell
Copy-Item Backend-H\.env.example .env
```

Abre `.env` y cambia `JWT_SECRET` por una clave aleatoria de al menos 32 caracteres. Puedes generarla con:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Luego construye e inicia el backend y PostgreSQL:

```powershell
docker compose up --build -d
```

Compose publica el backend en `http://localhost:3000` y PostgreSQL en el puerto `5432`. Al iniciar por primera vez una base de datos vacia, PostgreSQL ejecuta `database/init/01-schema.sql` y crea las tablas, restricciones e indices.

Para revisar el estado y los logs:

```powershell
docker compose ps
docker compose logs -f backend
```

Para detener los servicios sin eliminar los datos:

```powershell
docker compose down
```

Los datos se conservan en el volumen `postgres_data`. El script SQL de inicializacion se ejecuta automaticamente solo cuando PostgreSQL crea un directorio de datos nuevo; no se vuelve a aplicar sobre un volumen ya inicializado.

## Ejecucion local del backend

1. Crea la configuracion local y ajusta `DATABASE_URL` para que apunte a tu PostgreSQL:

   ```powershell
   Copy-Item Backend-H\.env.example Backend-H\.env
   ```

   Configura tambien un `JWT_SECRET` de al menos 32 caracteres. No uses los valores de ejemplo en produccion.

2. Crea la base de datos `hotel_db` y aplica el esquema desde la raiz del repositorio:

   ```powershell
   psql -U hotel_user -d hotel_db -f database/init/01-schema.sql
   ```

   Ajusta el usuario y la base de datos del comando a tu instalacion. La base debe existir antes de aplicar el esquema.

3. Instala dependencias e inicia el servidor:

   ```powershell
   Set-Location Backend-H
   npm install
   npm run dev
   ```

El servidor valida las variables `DATABASE_URL` y `JWT_SECRET` al arrancar. Tambien acepta `PORT`, `NODE_ENV`, `JWT_EXPIRE`, `BCRYPT_ROUNDS`, parametros del pool de PostgreSQL y opciones de CORS, entre otras. Consulta `Backend-H/.env.example` para la lista de variables y sus valores de referencia.

## API

- Estado del servicio: `GET /health`
- Documentacion interactiva: `http://localhost:3000/api-docs`
- Especificacion OpenAPI en JSON: `http://localhost:3000/api-docs.json`
- Recursos: `/api/users`, `/api/clients`, `/api/rooms`, `/api/room-types`, `/api/reservations`, `/api/check-in`, `/api/payments` y `/api/dashboard`

El registro y el inicio de sesion estan disponibles en `POST /api/users/register` y `POST /api/users/login`. Las rutas protegidas requieren el token JWT recibido al iniciar sesion:

```http
Authorization: Bearer <token>
```

El dashboard requiere rol `admin` o `manager`. Otras operaciones aplican permisos por rol; la documentacion Swagger describe los endpoints publicados.

No se crea un usuario inicial automaticamente. Registra una cuenta con `name`, `email` y `password` antes de iniciar sesion; el registro asigna el rol `receptionist`.

Ejemplo de inicio de sesion:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:3000/api/users/login `
  -ContentType 'application/json' `
  -Body '{"email":"usuario@hotel.com","password":"password123"}'
```

## Pruebas

Las pruebas unitarias usan Jest y no requieren iniciar el servidor:

```powershell
Set-Location Backend-H
npm test
```

Para ejecutar las pruebas serialmente:

```powershell
npm test -- --runInBand
```

## Estructura

```text
Backend-H/
  src/
    config/       Configuracion, PostgreSQL y OpenAPI
    controllers/  Logica de endpoints
    middleware/   Autenticacion, permisos, validacion y errores
    models/       Acceso a datos
    routes/       Rutas HTTP
    utils/        Utilidades y respuestas
    validators/   Esquemas Joi
  tests/          Pruebas unitarias Jest
database/
  init/           Esquema inicial de PostgreSQL
```
