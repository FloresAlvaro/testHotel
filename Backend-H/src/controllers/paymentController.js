const PaymentService = require('../services/paymentService');
const Payment = require('../models/Payment');
const { sendSuccess, sendCreated, sendUpdated, sendError, sendPaginated } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } = require('../config/constants');
const { getPaginationParams } = require('../utils/helpers');

class PaymentController {
  /**
   * Crear pago
   */
  static async create(req, res, next) {
    try {
      const payment = await PaymentService.create(req.body, { ...req.user, ip: req.ip });
      sendCreated(res, payment, SUCCESS_MESSAGES.PAYMENT_CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener pago por ID
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);

      if (!payment) {
        return sendError(res, ERROR_MESSAGES.PAYMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      sendSuccess(res, payment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los pagos
   */
  static async getAll(req, res, next) {
    try {
      const { page = 1, pageSize = 10, status } = req.query;

      const { offset, limit, page: currentPage } = getPaginationParams(page, pageSize, 10);

      const payments = await Payment.findAll(limit, offset, status);
      const total = await Payment.countAll(status);

      sendPaginated(res, payments, total, currentPage, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener pagos de una reserva
   */
  static async getByReservation(req, res, next) {
    try {
      const { reservationId } = req.params;

      const payments = await Payment.findByReservationId(reservationId);

      sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar datos de un pago pendiente
   */
  static async update(req, res, next) {
    try {
      const payment = await PaymentService.update(req.params.id, req.body, { ...req.user, ip: req.ip });
      sendUpdated(res, payment, SUCCESS_MESSAGES.PAYMENT_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar estado de pago
   */
  static async updateStatus(req, res, next) {
    try {
      const payment = await PaymentService.changeStatus(req.params.id, req.body.status, { ...req.user, ip: req.ip });
      sendUpdated(res, payment, 'Estado de pago actualizado');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Completar pago
   */
  static async complete(req, res, next) {
    try {
      const payment = await PaymentService.changeStatus(req.params.id, 'completed', { ...req.user, ip: req.ip }, 'pending');
      sendSuccess(res, payment, HTTP_STATUS.OK, SUCCESS_MESSAGES.PAYMENT_COMPLETED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reembolsar pago
   */
  static async refund(req, res, next) {
    try {
      const payment = await PaymentService.changeStatus(req.params.id, 'refunded', { ...req.user, ip: req.ip }, 'completed');
      sendSuccess(res, payment, HTTP_STATUS.OK, 'Pago reembolsado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener ingresos por período
   */
  static async getRevenueByPeriod(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return sendError(res, 'Fechas de inicio y fin requeridas', HTTP_STATUS.BAD_REQUEST);
      }

      const revenue = await Payment.getRevenueByPeriod(startDate, endDate);

      sendSuccess(res, revenue);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener ingresos por método de pago
   */
  static async getRevenueByMethod(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return sendError(res, 'Fechas de inicio y fin requeridas', HTTP_STATUS.BAD_REQUEST);
      }

      const revenue = await Payment.getRevenueByMethod(startDate, endDate);

      sendSuccess(res, revenue);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener pagos pendientes
   */
  static async getPending(req, res, next) {
    try {
      const { page = 1, pageSize = 10 } = req.query;

      const { offset, limit } = getPaginationParams(page, pageSize, 10);

      const payments = await Payment.findPending(limit, offset);

      sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentController;