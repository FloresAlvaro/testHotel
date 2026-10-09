const { randomUUID } = require('node:crypto');

const requestId = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader('X-Request-ID', req.requestId);

  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400 && body && typeof body === 'object' && !Array.isArray(body)) {
      return json({ ...body, requestId: req.requestId });
    }
    return json(body);
  };
  next();
};

module.exports = requestId;
