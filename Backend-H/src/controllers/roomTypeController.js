const RoomTypeService = require('../services/roomTypeService');
const RoomType = require('../models/RoomType');
const {
  sendSuccess,
  sendCreated,
  sendUpdated,
  sendError,
  sendPaginated,
} = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } = require('../config/constants');
const { getPaginationParams } = require('../utils/helpers');

class RoomTypeController {
  /**
   * Crear tipo de habitación
   */
  static async create(req, res, next) {
    try {
      const created = await RoomTypeService.create(req.body);
      sendCreated(res, created, SUCCESS_MESSAGES.CREATED_SUCCESS);
    } catch (error) {
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

      const { offset, limit, page: currentPage } = getPaginationParams(page, pageSize, 10);

      const roomTypes = await RoomType.findAllPaginated(limit, offset);
      const total = await RoomType.countAll();

      sendPaginated(res, roomTypes, total, currentPage, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar tipo de habitación
   */
  static async update(req, res, next) {
    try {
      const updated = await RoomTypeService.update(req.params.id, req.body);
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
      const updated = await RoomTypeService.deactivate(req.params.id);
      sendSuccess(res, updated, HTTP_STATUS.OK, 'Tipo de habitación desactivado');
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
