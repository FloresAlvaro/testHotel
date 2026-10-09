jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));
process.env.SMTP_HOST = 'smtp.test.invalid';
process.env.SMTP_RETRY_DELAY_MS = '1';
const nodemailer = require('nodemailer');
const mail = require('../src/services/mailService');
describe('Entrega SMTP', () => {
  let transport;
  beforeEach(() => {
    transport = { sendMail: jest.fn(), close: jest.fn() };
    nodemailer.createTransport.mockReturnValue(transport);
  });
  test('reintenta fallos transitorios conservando el mismo enlace', async () => {
    transport.sendMail
      .mockRejectedValueOnce(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }))
      .mockResolvedValue({});
    expect(
      await mail.sendLink('employee@example.com', 'https://hotel.example/#token=example', 'invite'),
    ).toBe(true);
    expect(transport.sendMail).toHaveBeenCalledTimes(2);
    expect(transport.sendMail.mock.calls[0][0]).toBe(transport.sendMail.mock.calls[1][0]);
    expect(transport.close).toHaveBeenCalled();
  });
  test('no reintenta fallos permanentes ni credenciales rechazadas', async () => {
    transport.sendMail.mockRejectedValue(
      Object.assign(new Error('denied'), { code: 'EAUTH', responseCode: 535 }),
    );
    await expect(
      mail.sendLink('employee@example.com', 'https://hotel.example', 'reset'),
    ).rejects.toThrow('denied');
    expect(transport.sendMail).toHaveBeenCalledTimes(1);
    expect(transport.close).toHaveBeenCalled();
  });
  test('limita los reintentos de un servidor no disponible', async () => {
    transport.sendMail.mockRejectedValue(
      Object.assign(new Error('unavailable'), { responseCode: 451 }),
    );
    await expect(
      mail.sendLink('employee@example.com', 'https://hotel.example', 'reset'),
    ).rejects.toThrow('unavailable');
    expect(transport.sendMail).toHaveBeenCalledTimes(3);
  });
});
