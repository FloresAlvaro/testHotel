const ReservationService = require('../services/reservationService');
const Reservation = require('../models/Reservation');
const Client = require('../models/Client');
const { sendSuccess, sendCreated, sendUpdated, sendError, 
        sendPaginated } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } = require('../config/constants');
const { getPaginationParams } = require('../utils/helpers');

class ReservationController {
  /**
   * Crear reserva
   */
  static async create(req, res, next) {
    try {
      const reservation = await ReservationService.create(req.body, { ...req.user, ip: req.ip });
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

      const { offset, limit, page: currentPage } = getPaginationParams(page, pageSize, 10);

      const reservations = await Reservation.findAll(limit, offset, status);
      const total = await Reservation.countAll(status);

      sendPaginated(res, reservations, total, currentPage, limit);
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

      const { offset, limit } = getPaginationParams(page, pageSize, 10);

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
      const reservation = await ReservationService.update(req.params.id, req.body, { ...req.user, ip: req.ip });
      sendUpdated(res, reservation, SUCCESS_MESSAGES.UPDATED_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancelar reserva
   */
  static async cancel(req, res, next) {
    try {
      const reservation = await ReservationService.cancel(req.params.id, { ...req.user, ip: req.ip });
      sendSuccess(res, reservation, HTTP_STATUS.OK, SUCCESS_MESSAGES.RESERVATION_CANCELLED);
    } catch (error) {
      next(error);
    }
  }

}

module.exports = ReservationController;