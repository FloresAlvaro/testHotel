const url = new URL(process.env.FRONTEND_URL || 'http://localhost:3001');
if (!['http:', 'https:'].includes(url.protocol))
  throw new Error('FRONTEND_URL debe ser HTTP o HTTPS');
module.exports = {
  frontendURL: url.origin,
  cookieName: 'hotel_session',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/api',
    secure:
      process.env.COOKIE_SECURE === undefined
        ? url.protocol === 'https:'
        : process.env.COOKIE_SECURE === 'true',
  },
};
