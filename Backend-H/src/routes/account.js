const express = require('express');
const Joi = require('joi');
const { rateLimit } = require('express-rate-limit');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorization');
const validate = require('../middleware/validation');
const service = require('../services/authService');
const sessions = require('../services/sessionService');
const { cookieName, cookieOptions } = require('../config/auth');
const { sendSuccess, sendCreated } = require('../utils/response');
const { inviteSchema, consumeSchema, resetSchema } = require('../validators/accountValidator');
const router = express.Router();
const limited = rateLimit({
  windowMs: 900000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos. Intenta nuevamente más tarde.' },
});
const action = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

router.post(
  '/invitations',
  auth,
  authorize('admin'),
  validate(inviteSchema),
  action(async (req, res) => {
    const result = await service.invite(req.body, { ...req.user, ip: req.ip });
    sendCreated(res, result, 'Invitación creada');
  }),
);
router.post(
  '/accept-invitation',
  limited,
  validate(consumeSchema),
  action(async (req, res) => {
    await service.consume(req.body.token, req.body.password, 'invite');
    res.clearCookie(cookieName, cookieOptions);
    sendSuccess(res, null, 200, 'Cuenta activada. Ya puedes iniciar sesión.');
  }),
);
router.post(
  '/forgot-password',
  limited,
  validate(resetSchema),
  action(async (req, res) => {
    await service.requestReset(req.body.email);
    sendSuccess(res, null, 200, 'Si la cuenta está habilitada, recibirás un enlace por correo.');
  }),
);
router.post(
  '/reset-password',
  limited,
  validate(consumeSchema),
  action(async (req, res) => {
    await service.consume(req.body.token, req.body.password, 'reset');
    res.clearCookie(cookieName, cookieOptions);
    sendSuccess(res, null, 200, 'Contraseña actualizada. Inicia sesión nuevamente.');
  }),
);
router.get(
  '/sessions',
  auth,
  action(async (req, res) => sendSuccess(res, await sessions.list(req.user.id, req.user.sid))),
);
router.delete(
  '/sessions/:sessionId',
  auth,
  validate(Joi.object({ sessionId: Joi.string().guid().required() }), 'params'),
  action(async (req, res) => {
    if (!(await sessions.revoke(req.params.sessionId, req.user.id)))
      return res.status(404).json({ message: 'Sesión no encontrada' });
    if (req.params.sessionId === req.user.sid) res.clearCookie(cookieName, cookieOptions);
    sendSuccess(res, null, 200, 'Sesión cerrada');
  }),
);
router.post(
  '/logout',
  auth,
  action(async (req, res) => {
    await sessions.revoke(req.user.sid, req.user.id);
    res.clearCookie(cookieName, cookieOptions);
    sendSuccess(res, null, 200, 'Sesión cerrada');
  }),
);
router.post(
  '/logout-all',
  auth,
  action(async (req, res) => {
    await sessions.revokeAll(req.user.id);
    res.clearCookie(cookieName, cookieOptions);
    sendSuccess(res, null, 200, 'Todas las sesiones fueron cerradas');
  }),
);
module.exports = { router, inviteSchema, consumeSchema, resetSchema };
