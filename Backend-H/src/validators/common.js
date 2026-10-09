const Joi = require('joi');
const validate = require('../middleware/validation');

const id = Joi.number().integer().positive().max(2147483647);
const date = Joi.string().custom((value, helpers) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return helpers.error('any.invalid');
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'fecha de calendario');
const periodSchema = Joi.object({
  startDate: date.required(),
  endDate: date.required(),
}).custom((value, helpers) =>
  value.startDate <= value.endDate ? value : helpers.error('any.invalid'),
);

const configureRouter = (router) => {
  for (const name of ['id', 'clientId', 'reservationId']) {
    router.param(name, (req, res, next, value) =>
      validate(Joi.object({ [name]: id.required() }))({ body: { [name]: value } }, res, next),
    );
  }
  router.param('floor', (req, res, next, value) =>
    validate(
      Joi.object({
        floor: Joi.number().integer().min(0).max(2147483647).required(),
      }),
    )({ body: { floor: value } }, res, next),
  );
  router.use(
    validate(
      Joi.object({
        page: Joi.number().integer().positive().max(1000000),
        pageSize: Joi.number().integer().positive().max(100),
        days: Joi.number().integer().min(0).max(365),
        roomTypeId: id,
        q: Joi.string().trim().min(1).max(200),
      }).unknown(true),
      'query',
    ),
  );
};

module.exports = { id, date, periodSchema, configureRouter };
