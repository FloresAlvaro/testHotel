const fs = require('node:fs');
const path = require('node:path');
const spec = require('../src/config/swagger');
const fromJoi = require('../src/config/joiSchema');
describe('Contrato del backend', () => {
  test('todos los endpoints de los routers tienen documentación', () => {
    const prefixes = {
      users: 'users',
      clients: 'clients',
      rooms: 'rooms',
      roomTypes: 'room-types',
      reservations: 'reservations',
      payments: 'payments',
      checkIn: 'check-in',
      dashboard: 'dashboard',
      account: 'account',
    };
    for (const [file, prefix] of Object.entries(prefixes)) {
      const text = fs.readFileSync(path.join(__dirname, `../src/routes/${file}.js`), 'utf8');
      for (const [, method, route] of text.matchAll(
        /router\.(get|post|put|patch|delete)\(\s*'([^']+)'/g,
      )) {
        const url = `/api/${prefix}${route === '/' ? '' : route}`.replace(/:(\w+)/g, '{$1}');
        expect(spec.paths[url]?.[method]).toBeDefined();
      }
    }
  });
  test('solicitudes describen campos requeridos, límites y nulos desde Joi', () => {
    const client = require('../src/validators/clientValidator').createSchema;
    const model = fromJoi(client);
    expect(model.required).toEqual(['name', 'document']);
    expect(model.properties.email).toMatchObject({
      nullable: true,
      format: 'email',
      maxLength: 200,
    });
    expect(spec.components.schemas.CreateClientRequest).toEqual(model);
    expect(
      fromJoi(require('../src/validators/roomTypeValidator').createSchema).properties.capacity,
    ).toMatchObject({ type: 'integer', minimum: 0, exclusiveMinimum: true });
  });
  test('esquema de instalación coincide con la migración inicial congelada', () => {
    const read = (file) =>
      fs.readFileSync(path.resolve(__dirname, file), 'utf8').replace(/\r\n/g, '\n').trim();
    expect(read('../migrations/000-initial.sql')).toBe(read('../../database/init/01-schema.sql'));
  });
});
