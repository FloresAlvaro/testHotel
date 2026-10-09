const express = require('express');
const requestId = require('../src/middleware/requestId');
const errorHandler = require('../src/middleware/errorHandler');

describe('Correlación de solicitudes HTTP', () => {
  let server;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const request = (path) => fetch(`http://127.0.0.1:${server.address().port}${path}`);

  beforeAll(async () => {
    const app = express();
    app.use(requestId);
    app.get('/ok', (_req, res) => res.json({ success: true }));
    app.get('/forbidden', (_req, res) => res.status(403).json({ message: 'Sin permiso' }));
    app.get('/error', (_req, _res, next) => next(new Error('Fallo privado')));
    app.use(errorHandler);
    server = await new Promise((resolve) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    });
  });
  afterAll(async () => {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeIdleConnections();
    });
  });
  test('cada solicitud recibe un UUID distinto, sin cambiar respuestas exitosas', async () => {
    const first = await request('/ok');
    const second = await request('/ok');
    expect(first.headers.get('X-Request-ID')).toMatch(uuid);
    expect(second.headers.get('X-Request-ID')).not.toBe(first.headers.get('X-Request-ID'));
    expect(await first.json()).toEqual({ success: true });
    await second.json();
  });
  test('errores directos incluyen el mismo ID que la cabecera', async () => {
    const response = await request('/forbidden');
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.requestId).toBe(response.headers.get('X-Request-ID'));
    expect(body.message).toBe('Sin permiso');
  });
  test('un error interno conserva el mismo ID en respuesta y log', async () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await request('/error');
      const body = await response.json();
      expect(response.status).toBe(500);
      expect(body.requestId).toBe(response.headers.get('X-Request-ID'));
      expect(log).toHaveBeenCalledWith(
        'Error interno:',
        expect.objectContaining({ requestId: body.requestId }),
      );
      expect(body.message).toBe('Error interno del servidor');
    } finally {
      log.mockRestore();
    }
  });
});
