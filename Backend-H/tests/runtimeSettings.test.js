const settings = require('../src/config/runtimeSettings');
describe('Configuración de operación', () => {
  test.each([
    { SESSION_MAX_AGE: 'NaN' },
    { SESSION_MAX_AGE: '0' },
    { SMTP_PORT: '65536' },
    { SMTP_SECURE: 'yes' },
    { CORS_CREDENTIALS: 'true', CORS_ORIGIN: '*' },
    {
      CORS_CREDENTIALS: 'true',
      CORS_ORIGIN: 'https://other.example',
      FRONTEND_URL: 'https://hotel.example',
    },
    { FRONTEND_URL: 'https://hotel.example/path' },
    { FRONTEND_URL: 'https://hotel.example', COOKIE_SECURE: 'false' },
    { TRUST_PROXY: 'true' },
    { TRUST_PROXY: '1' },
    { TRUST_PROXY: '0.0.0.0/0' },
  ])('rechaza configuración incoherente %j', (env) => expect(() => settings(env)).toThrow());
  test('acepta proxy delimitado y configuración coherente de HTTPS', () => {
    expect(
      settings({
        FRONTEND_URL: 'https://hotel.example',
        CORS_ORIGIN: 'https://hotel.example',
        CORS_CREDENTIALS: 'true',
        TRUST_PROXY: 'loopback,10.0.0.5/32',
      }),
    ).toMatchObject({ TRUST_PROXY: ['loopback', '10.0.0.5/32'], SMTP_PORT: 587 });
  });
});
