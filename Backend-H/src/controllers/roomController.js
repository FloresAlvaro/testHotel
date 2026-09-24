const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const { sendSuccess, sendCreated, sendUpdated, sendError, 
        sendPaginated } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS, ROOM_STATUS } = require('../config/constants');

class RoomController {
  /**
   * Crear habitación
   */
  static async create(req, res, next) {
    try {
      const { number, room_type_id, floor } = req.body;

      // Validaciones
      if (!number || !room_type_id) {
        return sendError(res, 'Número de habitación y tipo son requeridos', HTTP_STATUS.BAD_REQUEST);
      }

      // Verificar que tipo de habitación existe
      const roomType = await RoomType.findById(room_type_id);
      if (!roomType) {
        return sendError(res, ERROR_MESSAGES.ROOM_TYPE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const room = await Room.create({ number, room_type_id, floor: floor || 0 });

      sendCreated(res, room, SUCCESS_MESSAGES.CREATED_SUCCESS);
    } catch (error) {
      if (error.message.includes('ya existe')) {
        return sendError(res, ERROR_MESSAGES.CONFLICT, HTTP_STATUS.CONFLICT);
      }
      next(error);
    }
  }

  /**
   * Obtener habitación por ID
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const room = await Room.findById(id);

      if (!room) {
        return sendError(res, ERROR_MESSAGES.ROOM_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      sendSuccess(res, room);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todas las habitaciones
   */
  static async getAll(req, res, next) {
    try {
      const { page = 1, pageSize = 10, status } = req.query;

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

      let rooms;
      let total;

      if (status === 'available') {
        rooms = await Room.findAvailable(limit, offset);
      } else {
        rooms = await Room.findAll(limit, offset);
      }

      total = await Room.countAll();

      sendPaginated(res, rooms, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener habitaciones disponibles
   */
  static async getAvailable(req, res, next) {
    try {
      const { page = 1, pageSize = 10 } = req.query;

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

      const rooms = await Room.findAvailable(limit, offset);

      sendSuccess(res, rooms);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener habitaciones disponibles para fechas
   */
  static async getAvailableForDates(req, res, next) {
    try {
      const { checkIn, checkOut, roomTypeId } = req.query;

      if (!checkIn || !checkOut) {
        return sendError(res, 'Fechas de entrada y salida son requeridas', HTTP_STATUS.BAD_REQUEST);
      }

      const rooms = await Room.findAvailableForDates(checkIn, checkOut, roomTypeId);

      sendSuccess(res, rooms);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar habitación
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { number, room_type_id, floor, status } = req.body;

      const room = await Room.findById(id);
      if (!room) {
        return sendError(res, ERROR_MESSAGES.ROOM_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      if (status && !Object.values(ROOM_STATUS).includes(status)) {
        return sendError(res, 'Estado de habitación inválido', HTTP_STATUS.BAD_REQUEST);
      }

      if (status && status !== room.status) {
        const allowedTransitions = {
          available: ['reserved', 'maintenance'],
          reserved: ['occupied', 'available', 'maintenance'],
          occupied: ['maintenance'],
          maintenance: ['available']
        };

        if (!allowedTransitions[room.status].includes(status)) {
          return sendError(res, 'Transición de estado de habitación no permitida', HTTP_STATUS.CONFLICT);
        }
      }

      const updated = await Room.update(id, {
        number: number || room.number,
        room_type_id: room_type_id || room.room_type_id,
        floor: floor ?? room.floor,
        status: status || room.status
      });

      sendUpdated(res, updated, SUCCESS_MESSAGES.UPDATED_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cambiar estado de habitación
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validar estado
      const validStatuses = Object.values(ROOM_STATUS);
      if (!validStatuses.includes(status)) {
        return sendError(res, 'Estado de habitación inválido', HTTP_STATUS.BAD_REQUEST);
      }

      const room = await Room.findById(id);
      if (!room) {
        return sendError(res, ERROR_MESSAGES.ROOM_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const allowedTransitions = {
        available: ['available', 'reserved', 'maintenance'],
        reserved: ['reserved', 'occupied', 'available', 'maintenance'],
        occupied: ['occupied', 'maintenance'],
        maintenance: ['maintenance', 'available']
      };

      if (!allowedTransitions[room.status].includes(status)) {
        return sendError(res, 'Transición de estado de habitación no permitida', HTTP_STATUS.CONFLICT);
      }

      const updated = await Room.updateStatus(id, status);

      sendUpdated(res, updated, `Estado actualizado a ${status}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estado de ocupación
   */
  static async getOccupancyStatus(req, res, next) {
    try {
      const stats = await Room.getOccupancyStatus();

      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener habitaciones por piso
   */
  static async getByFloor(req, res, next) {
    try {
      const { floor } = req.params;

      if (!floor || isNaN(floor)) {
        return sendError(res, 'Piso inválido', HTTP_STATUS.BAD_REQUEST);
      }

      const rooms = await Room.findByFloor(parseInt(floor));

      sendSuccess(res, rooms);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RoomController;