const User = require('../models/User');
const { sendSuccess, sendCreated, sendUpdated, sendDeleted, sendError, 
        sendLoginSuccess, sendLoginFailed, sendPaginated, sendValidationErrors } = require('../utils/response');
const { formatDate } = require('../utils/helpers');
const { createToken } = require('../utils/jwt');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS, USER_ROLES } = require('../config/constants');

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
        role: USER_ROLES.RECEPTIONIST
      });

      // Generar token
      const token = createToken(
        { id: user.id, email: user.email, role: user.role },
      );

      sendCreated(res, { user, token }, SUCCESS_MESSAGES.USER_CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Iniciar sesión
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, 'Email y contraseña son requeridos', HTTP_STATUS.BAD_REQUEST);
      }

      // Verificar credenciales
      const user = await User.verifyPassword(email, password);
      if (!user) {
        return sendLoginFailed(res);
      }

      // Verificar si el usuario está activo
      if (!user.is_active) {
        return sendError(res, ERROR_MESSAGES.USER_INACTIVE, HTTP_STATUS.FORBIDDEN);
      }

      // Generar token
      const token = createToken(
        { id: user.id, email: user.email, role: user.role },
      );

      // Remover contraseña de la respuesta
      delete user.password;

      sendLoginSuccess(res, user, token);
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
      
      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

      const users = await User.findAll(limit, offset, role);
      const total = await User.countAll(role);

      sendPaginated(res, users, total, page, limit);
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
      const { id } = req.params;
      const { name, email, role, is_active } = req.body;

      // Verificar que el usuario exista
      const user = await User.findById(id);
      if (!user) {
        return sendError(res, ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      // Actualizar
      const updatedUser = await User.update(id, { name, email, role, is_active });

      sendUpdated(res, updatedUser, SUCCESS_MESSAGES.USER_UPDATED);
    } catch (error) {
      if (error.message.includes('email ya está')) {
        return sendError(res, ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
      }
      next(error);
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validaciones
      if (!currentPassword || !newPassword || !confirmPassword) {
        return sendError(res, 'Todos los campos son requeridos', HTTP_STATUS.BAD_REQUEST);
      }

      if (newPassword !== confirmPassword) {
        return sendError(res, 'Las contraseñas no coinciden', HTTP_STATUS.BAD_REQUEST);
      }

      if (newPassword.length < 8) {
        return sendError(res, 'La contraseña debe tener al menos 8 caracteres', HTTP_STATUS.BAD_REQUEST);
      }

      // Verificar contraseña actual
      const isValid = await User.verifyPassword(id, currentPassword);
      if (!isValid) {
        return sendError(res, 'Contraseña actual incorrecta', HTTP_STATUS.UNAUTHORIZED);
      }

      // Cambiar contraseña
      const user = await User.updatePassword(id, newPassword);

      sendSuccess(res, user, HTTP_STATUS.OK, 'Contraseña actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desactivar usuario
   */
  static async deactivate(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.deactivate(id);
      if (!user) {
        return sendError(res, ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

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
      const { id } = req.params;

      const user = await User.activate(id);
      if (!user) {
        return sendError(res, ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

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

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

      const users = await User.search(q, limit, offset);

      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;