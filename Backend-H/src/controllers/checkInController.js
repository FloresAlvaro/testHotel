const ReservationService = require('../services/reservationService');
const CheckInLog = require('../models/CheckInLog');
const { sendSuccess, sendError, sendCheckInSuccess, sendCheckOutSuccess } = require('../utils/response');
const { ERROR_MESSAGES, HTTP_STATUS } = require('../config/constants');
const { getPaginationParams } = require('../utils/helpers');

class CheckInController {
  /**
   * Registrar check-in
   */
  static async checkIn(req, res, next) {
    try {
      const log = await ReservationService.checkIn(req.body.reservation_id, req.body.notes, { ...req.user, ip: req.ip });
      sendCheckInSuccess(res, log);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registrar check-out
   */
  static async checkOut(req, res, next) {
    try {
      const log = await ReservationService.checkOut(req.body.reservation_id, { ...req.user, ip: req.ip });
      sendCheckOutSuccess(res, log);
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

      const { offset, limit } = getPaginationParams(page, pageSize, 10);

      const history = await CheckInLog.findClientHistory(clientId, limit, offset);

      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CheckInController;
