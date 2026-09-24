const RoomType = require('../models/RoomType');
const { sendSuccess, sendCreated, sendUpdated, sendError, 
        sendPaginated } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } = require('../config/constants');

class RoomTypeController {
  /**
   * Crear tipo de habitación
   */
  static async create(req, res, next) {
    try {
      const { name, description, price, capacity, amenities, image } = req.body;

      // Validaciones
      if (!name || !price || !capacity) {
        return sendError(res, 'Nombre, precio y capacidad son requeridos', HTTP_STATUS.BAD_REQUEST);
      }

      if (price <= 0) {
        return sendError(res, 'El precio debe ser mayor a 0', HTTP_STATUS.BAD_REQUEST);
      }

      if (capacity <= 0) {
        return sendError(res, 'La capacidad debe ser mayor a 0', HTTP_STATUS.BAD_REQUEST);
      }

      const roomType = await RoomType.create({
        name, description, price: parseFloat(price), capacity: parseInt(capacity), amenities, image
      });

      sendCreated(res, roomType, SUCCESS_MESSAGES.CREATED_SUCCESS);
    } catch (error) {
      if (error.message.includes('ya existe')) {
        return sendError(res, ERROR_MESSAGES.CONFLICT, HTTP_STATUS.CONFLICT);
      }
      next(error);
    }
  }

  /**
   * Obtener tipo de habitación por ID
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const roomType = await RoomType.findById(id);

      if (!roomType) {
        return sendError(res, ERROR_MESSAGES.ROOM_TYPE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      sendSuccess(res, roomType);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los tipos
   */
  static async getAll(req, res, next) {
    try {
      const { page = 1, pageSize = 10 } = req.query;

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

      const roomTypes = await RoomType.findAllPaginated(limit, offset);
      const total = await RoomType.countAll();

      sendPaginated(res, roomTypes, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar tipo de habitación
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, price, capacity, amenities, image } = req.body;

      const roomType = await RoomType.findById(id);
      if (!roomType) {
        return sendError(res, ERROR_MESSAGES.ROOM_TYPE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const updated = await RoomType.update(id, {
        name, description, price: parseFloat(price), capacity: parseInt(capacity), amenities, image
      });

      sendUpdated(res, updated, SUCCESS_MESSAGES.UPDATED_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desactivar tipo de habitación
   */
  static async deactivate(req, res, next) {
    try {
      const { id } = req.params;

      const roomType = await RoomType.findById(id);
      if (!roomType) {
        return sendError(res, ERROR_MESSAGES.ROOM_TYPE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const deactivated = await RoomType.deactivate(id);

      sendSuccess(res, deactivated, HTTP_STATUS.OK, 'Tipo de habitación desactivado');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas de disponibilidad
   */
  static async getAvailabilityStats(req, res, next) {
    try {
      const { id } = req.params;

      const roomType = await RoomType.findById(id);
      if (!roomType) {
        return sendError(res, ERROR_MESSAGES.ROOM_TYPE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const stats = await RoomType.getAvailabilityStats(id);

      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RoomTypeController;