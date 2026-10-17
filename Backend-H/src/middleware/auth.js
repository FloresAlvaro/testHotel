const requestContext = require('../utils/requestContext');
const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    if ((decoded.version || 0) !== (user.auth_version || 0)) return res.status(401).json({message:'La sesión venció. Inicia sesión de nuevo.'});

    if (!user.is_active || (user.role === 'customer' && (!user.client_id || user.client_active !== true))) {
      return res.status(403).json({ message: 'El usuario está inactivo' });
    }

    req.user = {
      ...decoded,
      id: user.id,
      email: user.email,
      role: user.role,
      client_id: user.client_id,
      is_active: user.is_active
    };
    requestContext.run({ userId: user.id, ip: req.ip }, next);
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