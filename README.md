# Sistema de gestion hotelera

Aplicacion para administrar usuarios, clientes, habitaciones, reservas, entradas y salidas, pagos e indicadores. Incluye frontend Nuxt, API REST con Express y PostgreSQL.

## Requisitos

- Docker Desktop con Docker Compose v2.
- Node.js 20 o superior y npm solo para desarrollo local o pruebas.

## Inicio completo con Docker

Ejecuta los comandos desde la raiz del repositorio. Primero crea el archivo de entorno:

```powershell
Copy-Item .env.example .env
```

Edita `.env` y reemplaza `JWT_SECRET` por una clave aleatoria de al menos 32 caracteres. Para generarla en PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Los valores de `.env.example` sirven para desarrollo local; cambia tambien la contrasena de PostgreSQL antes de exponer el sistema. Si cambias `POSTGRES_PASSWORD`, usa caracteres seguros para URL, por ejemplo letras y numeros.

Construye las imagenes e inicia PostgreSQL, el backend y el frontend:

```powershell
docker compose up --build -d
```

Abre la aplicacion en `http://localhost:3001`. La API esta en `http://localhost:3000`, la documentacion en `http://localhost:3000/api-docs` y PostgreSQL se publica en el puerto `5432`. En el primer inicio, PostgreSQL crea el esquema desde `database/init/01-schema.sql`.

Comprueba el estado y los logs:

```powershell
docker compose ps
docker compose logs -f backend frontend
```

Verifica el backend:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Para detener los servicios sin borrar los datos:

```powershell
docker compose down
```

Los datos permanecen en el volumen `postgres_data`. El script de inicializacion se ejecuta solo al crear un volumen vacio; los cambios posteriores al SQL no se aplican automaticamente. `docker compose down -v` elimina la base de datos y todos sus datos.

Si un puerto esta ocupado, cambia `FRONTEND_PORT`, `BACKEND_PORT` o `POSTGRES_PORT` en `.env` y vuelve a ejecutar Compose. El frontend usa la URL interna de Docker para sus solicitudes SSR y la URL publicada del backend desde el navegador. Si sirves el frontend desde otro origen local, define `CORS_ORIGIN` en `.env` con el origen exacto (por ejemplo, `http://localhost:3002`); puedes separar varios origenes con comas.

## Desarrollo local

Puedes mantener PostgreSQL y el backend en Docker y ejecutar Nuxt con recarga en caliente. Desde la raiz:

```powershell
Copy-Item .env.example .env
docker compose up --build -d db backend
Set-Location Frontend-H
npm ci
$env:NUXT_PUBLIC_API_BASE = 'http://localhost:3000/api'
$env:NUXT_API_INTERNAL_BASE = 'http://localhost:3000/api'
npm run dev -- --host 0.0.0.0 --port 3001
```

La interfaz local quedara en `http://localhost:3001`. Para ejecutar el backend fuera de Docker, crea `Backend-H/.env` desde `Backend-H/.env.example` y configura `DATABASE_URL` con una instancia PostgreSQL accesible. La base debe existir antes de aplicar el esquema:

```powershell
psql -U hotel_user -d hotel_db -f database/init/01-schema.sql
Set-Location Backend-H
npm ci
npm run dev
```

Configura tambien `JWT_SECRET` con al menos 32 caracteres. El backend valida `DATABASE_URL` y `JWT_SECRET` al arrancar.

## API y primer usuario

- Estado: `GET /health`
- Swagger: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/api-docs.json`
- Recursos: `/api/users`, `/api/clients`, `/api/rooms`, `/api/room-types`, `/api/reservations`, `/api/check-in`, `/api/payments` y `/api/dashboard`

No se crea un usuario inicial automaticamente. Registra una cuenta desde la aplicacion o con `POST /api/users/register`, enviando `name`, `email` y `password`; el registro asigna el rol `receptionist`. El inicio de sesion esta en `POST /api/users/login`. Las rutas protegidas requieren `Authorization: Bearer <token>`. El dashboard requiere rol `admin` o `manager`.

## Pruebas

```powershell
Set-Location Backend-H
npm ci
$env:DATABASE_URL = 'postgresql://hotel_user:hotel_password@localhost:5432/hotel_db'
$env:JWT_SECRET = 'test-secret-at-least-32-characters-long'
npm test -- --runInBand
```

Las pruebas no requieren una instancia PostgreSQL activa; esas variables solo son necesarias para cargar la configuracion del backend.

## Solucion de problemas

- Si Compose indica que falta `JWT_SECRET`, confirma que copiaste `.env.example` como `.env` en la raiz y vuelve a iniciar los servicios.
- Si un puerto no esta disponible, modifica los puertos en `.env`; no cambies los puertos internos de los contenedores.
- Si cambiaste las credenciales PostgreSQL despues de inicializar el volumen, la base existente conserva las credenciales anteriores. Para reiniciar desde cero, `docker compose down -v` borra los datos.
- Para revisar un servicio concreto, usa `docker compose logs -f db`, `docker compose logs -f backend` o `docker compose logs -f frontend`.
