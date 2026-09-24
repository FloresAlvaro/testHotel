const CheckInLog = require('../models/CheckInLog');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const { sendSuccess, sendCreated, sendError, sendCheckInSuccess, sendCheckOutSuccess } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS, RESERVATION_STATUS, ROOM_STATUS } = require('../config/constants');
const { transaction } = require('../config/database');

class CheckInController {
  /**
   * Registrar check-in
   */
  static async checkIn(req, res, next) {
    try {
      const { reservation_id, notes } = req.body;
      const user_id = req.user.id;

      if (!reservation_id) {
        return sendError(res, 'ID de reserva requerido', HTTP_STATUS.BAD_REQUEST);
      }

      const result = await transaction(async (client) => {
        const reservation = await Reservation.findById(reservation_id, client, true);
        if (!reservation) {
          return { error: ERROR_MESSAGES.RESERVATION_NOT_FOUND, statusCode: HTTP_STATUS.NOT_FOUND };
        }

        if (reservation.status !== RESERVATION_STATUS.CONFIRMED) {
          return {
            error: 'Solo se puede realizar check-in de reservas confirmadas',
            statusCode: HTTP_STATUS.CONFLICT
          };
        }

        const existingCheckIn = await CheckInLog.findByReservationId(reservation_id, client, true);
        if (existingCheckIn && existingCheckIn.check_in_time) {
          return {
            error: ERROR_MESSAGES.RESERVATION_ALREADY_CHECKED_IN,
            statusCode: HTTP_STATUS.CONFLICT
          };
        }

        const createdCheckIn = await CheckInLog.create({
          reservation_id,
          user_id,
          check_in_time: new Date(),
          notes
        }, client);

        await Reservation.updateStatus(
          reservation_id,
          RESERVATION_STATUS.CHECKED_IN,
          client
        );
        await Room.updateStatus(reservation.room_id, ROOM_STATUS.OCCUPIED, client);
        return { checkIn: createdCheckIn };
      });

      if (result.error) {
        return sendError(res, result.error, result.statusCode);
      }

      sendCheckInSuccess(res, result.checkIn);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registrar check-out
   */
  static async checkOut(req, res, next) {
    try {
      const { reservation_id } = req.body;

      if (!reservation_id) {
        return sendError(res, 'ID de reserva requerido', HTTP_STATUS.BAD_REQUEST);
      }

      const result = await transaction(async (client) => {
        const reservation = await Reservation.findById(reservation_id, client, true);
        if (!reservation) {
          return { error: ERROR_MESSAGES.RESERVATION_NOT_FOUND, statusCode: HTTP_STATUS.NOT_FOUND };
        }

        if (reservation.status !== RESERVATION_STATUS.CHECKED_IN) {
          return {
            error: 'Solo se puede realizar check-out de reservas con check-in activo',
            statusCode: HTTP_STATUS.CONFLICT
          };
        }

        const checkInLog = await CheckInLog.findByReservationId(reservation_id, client, true);
        if (!checkInLog) {
          return { error: ERROR_MESSAGES.CHECKIN_LOG_NOT_FOUND, statusCode: HTTP_STATUS.NOT_FOUND };
        }

        if (checkInLog.check_out_time) {
          return { error: ERROR_MESSAGES.CHECKOUT_ALREADY_RECORDED, statusCode: HTTP_STATUS.CONFLICT };
        }

        const updatedCheckOut = await CheckInLog.updateCheckOut(
          checkInLog.id,
          new Date(),
          client
        );
        await Reservation.updateStatus(
          reservation_id,
          RESERVATION_STATUS.CHECKED_OUT,
          client
        );
        await Room.updateStatus(reservation.room_id, ROOM_STATUS.MAINTENANCE, client);
        return { checkOut: updatedCheckOut };
      });

      if (result.error) {
        return sendError(res, result.error, result.statusCode);
      }

      sendCheckOutSuccess(res, result.checkOut);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener check-ins del día
   */
  static async getTodayCheckIns(req, res, next) {
    try {
      const checkIns = await CheckInLog.findTodayCheckIns();

      sendSuccess(res, checkIns);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener check-outs pendientes
   */
  static async getPendingCheckOuts(req, res, next) {
    try {
      const checkOuts = await CheckInLog.findPendingCheckOuts();

      sendSuccess(res, checkOuts);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener log de check-in/out por reserva
   */
  static async getByReservation(req, res, next) {
    try {
      const { reservationId } = req.params;

      const checkInLog = await CheckInLog.findByReservationId(reservationId);
      if (!checkInLog) {
        return sendError(res, ERROR_MESSAGES.CHECKIN_LOG_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      sendSuccess(res, checkInLog);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener historial de un cliente
   */
  static async getClientHistory(req, res, next) {
    try {
      const { clientId } = req.params;
      const { page = 1, pageSize = 10 } = req.query;

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

      const history = await CheckInLog.findClientHistory(clientId, limit, offset);

      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CheckInController;