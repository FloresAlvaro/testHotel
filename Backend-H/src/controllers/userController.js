const AuthService = require('../services/authService');
const { cookieName, cookieOptions } = require('../config/auth');
const UserService = require('../services/userService');
const User = require('../models/User');
const {
  sendSuccess,
  sendCreated,
  sendUpdated,
  sendError,
  sendPaginated,
} = require('../utils/response');
const { getPaginationParams } = require('../utils/helpers');
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  HTTP_STATUS,
  USER_ROLES,
} = require('../config/constants');

class UserController {
  /**
   * Registrar nuevo usuario (empleado)
   */
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // Validaciones
      if (!name || !email || !password) {
        return sendError(res, 'Faltan campos requeridos', HTTP_STATUS.BAD_REQUEST);
      }

      // Verificar si email ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return sendError(res, ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
      }

      // Crear usuario
      const user = await User.create({
        name,
        email,
        password,
        role: USER_ROLES.RECEPTIONIST,
      });

      sendCreated(res, { user }, SUCCESS_MESSAGES.USER_CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Iniciar sesión
   */
  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body.email, req.body.password, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.cookie(cookieName, result.token, { ...cookieOptions, expires: result.expires });
      sendSuccess(res, { user: result.user }, HTTP_STATUS.OK, 'Sesión iniciada correctamente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  static async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return sendError(res, ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los usuarios (solo admin)
   */
  static async getAll(req, res, next) {
    try {
      const { page = 1, pageSize = 10, role } = req.query;

      const { offset, limit, page: currentPage } = getPaginationParams(page, pageSize, 10);

      const users = await User.findAll(limit, offset, role);
      const total = await User.countAll(role);

      sendPaginated(res, users, total, currentPage, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener usuario por ID
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return sendError(res, ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar usuario
   */
  static async update(req, res, next) {
    try {
      const user = await UserService.update(req.params.id, req.body, { ...req.user, ip: req.ip });
      sendUpdated(res, user, SUCCESS_MESSAGES.USER_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(req, res, next) {
    try {
      await AuthService.changePassword(
        req.params.id,
        req.body.currentPassword,
        req.body.newPassword,
      );
      if (Number(req.params.id) === req.user.id) res.clearCookie(cookieName, cookieOptions);
      sendSuccess(res, null, HTTP_STATUS.OK, 'Contraseña actualizada. Inicia sesión nuevamente.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desactivar usuario
   */
  static async deactivate(req, res, next) {
    try {
      const user = await UserService.update(
        req.params.id,
        { is_active: false },
        { ...req.user, ip: req.ip },
      );
      sendSuccess(res, user, HTTP_STATUS.OK, 'Usuario desactivado');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activar usuario
   */
  static async activate(req, res, next) {
    try {
      const user = await UserService.update(
        req.params.id,
        { is_active: true },
        { ...req.user, ip: req.ip },
      );
      sendSuccess(res, user, HTTP_STATUS.OK, 'Usuario activado');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar usuarios
   */
  static async search(req, res, next) {
    try {
      const { q, page = 1, pageSize = 10 } = req.query;

      if (!q) {
        return sendError(res, 'Término de búsqueda requerido', HTTP_STATUS.BAD_REQUEST);
      }

      const { offset, limit } = getPaginationParams(page, pageSize, 10);

      const users = await User.search(q, limit, offset);

      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
