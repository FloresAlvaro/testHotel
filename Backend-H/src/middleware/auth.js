const requestContext = require('../utils/requestContext');
const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const sessions = require('../services/sessionService');
    const session = token ? null : await sessions.resolve(req);
    
    if (!token && !session) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = token ? verifyToken(token) : session;
    if(session && !['GET','HEAD','OPTIONS'].includes(req.method) && !sessions.validCsrf(req,session)) return res.status(403).json({message:'La verificación de la sesión falló. Recarga la página.'});
    req.session = session;
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    if ((decoded.version || 0) !== (user.auth_version || 0)) return res.status(401).json({message:'La sesión venció. Inicia sesión de nuevo.'});

    if (!user.is_active || (user.role === 'customer' && (!user.client_id || user.client_active !== true))) {
      return res.status(403).json({ message: 'El usuario está inactivo' });
    }

    if(user.role==='admin'&&decoded.mfa_verified!==true&&await require('../services/mfaService').required(user))return res.status(401).json({message:'Completa la verificación MFA para acceder.'});

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