const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const Client = require('../models/Client');
const { sendSuccess, sendCreated, sendUpdated, sendError, 
        sendPaginated } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS, RESERVATION_STATUS } = require('../config/constants');
const { calculateTotalPrice, isDateBefore } = require('../utils/helpers');
const { transaction } = require('../config/database');

class ReservationController {
  /**
   * Crear reserva
   */
  static async create(req, res, next) {
    try {
      const { check_in, check_out, client_id, room_id, notes } = req.body;
      const user_id = req.user.id;

      // Validaciones
      if (!check_in || !check_out || !client_id || !room_id) {
        return sendError(res, 'Faltan campos requeridos', HTTP_STATUS.BAD_REQUEST);
      }

      // Validar que check_in es antes que check_out
      if (!isDateBefore(check_in, check_out)) {
        return sendError(res, ERROR_MESSAGES.CHECK_IN_AFTER_CHECK_OUT, HTTP_STATUS.BAD_REQUEST);
      }

      // Verificar que cliente existe
      const client = await Client.findById(client_id);
      if (!client) {
        return sendError(res, ERROR_MESSAGES.CLIENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      // Bloquear la habitación antes de comprobar disponibilidad y crear la reserva.
      const reservation = await transaction(async (client) => {
        const room = await Room.findById(room_id, client, true);
        if (!room) {
          const error = new Error(ERROR_MESSAGES.ROOM_NOT_FOUND);
          error.statusCode = HTTP_STATUS.NOT_FOUND;
          throw error;
        }

        const available = await Room.findAvailableForDates(
          check_in,
          check_out,
          room.room_type_id,
          client
        );
        if (!available.some(availableRoom => availableRoom.id === parseInt(room_id, 10))) {
          const error = new Error(ERROR_MESSAGES.ROOM_NOT_AVAILABLE_FOR_DATES);
          error.statusCode = HTTP_STATUS.CONFLICT;
          throw error;
        }

        const total_price = calculateTotalPrice(room.price, check_in, check_out);
        const createdReservation = await Reservation.create(
          { check_in, check_out, client_id, room_id, user_id, total_price },
          client
        );

        await Room.updateStatus(room_id, 'reserved', client);
        return createdReservation;
      });

      sendCreated(res, reservation, SUCCESS_MESSAGES.RESERVATION_CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener reserva por ID
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const reservation = await Reservation.findById(id);

      if (!reservation) {
        return sendError(res, ERROR_MESSAGES.RESERVATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      sendSuccess(res, reservation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todas las reservas
   */
  static async getAll(req, res, next) {
    try {
      const { page = 1, pageSize = 10, status } = req.query;

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

      const reservations = await Reservation.findAll(limit, offset, status);
      const total = await Reservation.countAll(status);

      sendPaginated(res, reservations, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener reservas activas
   */
  static async getActive(req, res, next) {
    try {
      const reservations = await Reservation.findActive();

      sendSuccess(res, reservations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener próximas reservas
   */
  static async getUpcoming(req, res, next) {
    try {
      const { days = 7 } = req.query;

      const reservations = await Reservation.findUpcoming(parseInt(days));

      sendSuccess(res, reservations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener reservas de un cliente
   */
  static async getByClient(req, res, next) {
    try {
      const { clientId } = req.params;
      const { page = 1, pageSize = 10 } = req.query;

      // Verificar que cliente existe
      const client = await Client.findById(clientId);
      if (!client) {
        return sendError(res, ERROR_MESSAGES.CLIENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

      const reservations = await Reservation.findByClientId(clientId, limit, offset);

      sendSuccess(res, reservations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar reserva
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { check_in, check_out, total_price, status, notes } = req.body;

      const allowedTransitions = {
        confirmed: ['confirmed', 'checked_in', 'cancelled'],
        checked_in: ['checked_in', 'checked_out'],
        checked_out: ['checked_out'],
        cancelled: ['cancelled']
      };

      const reservation = await Reservation.findById(id);
      if (!reservation) {
        return sendError(res, ERROR_MESSAGES.RESERVATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const nextStatus = status || reservation.status;
      if (!allowedTransitions[reservation.status].includes(nextStatus)) {
        return sendError(res, 'Transición de estado de reserva no permitida', HTTP_STATUS.CONFLICT);
      }

      const updated = await Reservation.update(id, {
        check_in: check_in || reservation.check_in,
        check_out: check_out || reservation.check_out,
        total_price: total_price ?? reservation.total_price,
        status: nextStatus,
        notes: notes ?? reservation.notes
      });

      sendUpdated(res, updated, SUCCESS_MESSAGES.UPDATED_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancelar reserva
   */
  static async cancel(req, res, next) {
    try {
      const { id } = req.params;

      const reservation = await Reservation.findById(id);
      if (!reservation) {
        return sendError(res, ERROR_MESSAGES.RESERVATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      // Verificar que no esté en check-in
      if (reservation.status === RESERVATION_STATUS.CHECKED_IN) {
        return sendError(res, ERROR_MESSAGES.CANNOT_CANCEL_CHECKED_IN, HTTP_STATUS.CONFLICT);
      }

      if (reservation.status !== RESERVATION_STATUS.CONFIRMED) {
        return sendError(res, 'Solo se pueden cancelar reservas confirmadas', HTTP_STATUS.CONFLICT);
      }

      const cancelled = await transaction(async (client) => {
        const cancelledReservation = await Reservation.cancel(id, client);
        await Room.updateStatus(reservation.room_id, 'available', client);
        return cancelledReservation;
      });

      sendUpdated(res, cancelled, SUCCESS_MESSAGES.RESERVATION_CANCELLED);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReservationController;