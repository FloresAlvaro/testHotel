const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');
const sessions = require('../services/sessionService');
const { cookieName, frontendURL } = require('../config/auth');

const auth = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    const cookies = Object.fromEntries(
      (req.headers.cookie || '').split(';').map((part) => {
        const index = part.indexOf('=');
        return index < 0 ? ['', ''] : [part.slice(0, index).trim(), part.slice(index + 1)];
      }),
    );
    const token = bearer || cookies[cookieName];

    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = verifyToken(token);
    if (!decoded.sid || !(await sessions.valid(decoded.sid, decoded.id))) {
      return res.status(401).json({ message: 'La sesión expiró o fue cerrada' });
    }
    if (
      !bearer &&
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.headers.origin !== frontendURL
    ) {
      return res.status(403).json({ message: 'Origen de la solicitud no permitido' });
    }
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'El usuario está inactivo' });
    }

    req.user = {
      ...decoded,
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'El token ha expirado' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }

    next(error);
  }
};

module.exports = auth;
