const PaymentService = require('../services/paymentService');
const Payment = require('../models/Payment');
const { sendSuccess, sendCreated, sendUpdated, sendError, sendPaginated } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS, PAYMENT_STATUS } = require('../config/constants');
const { getPaginationParams } = require('../utils/helpers');

const validReportPeriod = (start, end) => {
  const validDate = (value) => typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  return validDate(start) && validDate(end) && start <= end;
};

class PaymentController {
  /**
   * Crear pago
   */
  static async create(req, res, next) {
    try {
      const payment = await PaymentService.create(req.body);

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
      const { page = 1, pageSize = 10 } = req.query;
      const result = await require('../services/tableListService').list('payments', req.query);
      sendPaginated(res, result.rows, result.total, page, pageSize, undefined, result.summary ? { summary: result.summary } : {});
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
      const updated = await PaymentService.update(req.params.id, req.body);

      sendUpdated(res, updated, SUCCESS_MESSAGES.PAYMENT_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar estado de pago
   */
  static async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const updated = await PaymentService.changeStatus(req.params.id, status);

      sendUpdated(res, updated, `Pago ${status} exitosamente`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Completar pago
   */
  static async complete(req, res, next) {
    try {
      const completed = await PaymentService.changeStatus(req.params.id, PAYMENT_STATUS.COMPLETED, PAYMENT_STATUS.PENDING);

      sendSuccess(res, completed, HTTP_STATUS.OK, SUCCESS_MESSAGES.PAYMENT_COMPLETED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reembolsar pago
   */
  static async refund(req, res, next) {
    try {
      const refunded = await PaymentService.changeStatus(req.params.id, PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.COMPLETED);

      sendSuccess(res, refunded, HTTP_STATUS.OK, 'Pago reembolsado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener ingresos por período
   */
  static async getRevenueByPeriod(req, res, next) {
    try {
      const { startDate, endDate, method } = req.query;
      if (method && !require('../validators/listValidator').methods.includes(method)) return sendError(res, 'Método no válido', 400);

      if (!startDate || !endDate) {
        return sendError(res, 'Fechas de inicio y fin requeridas', HTTP_STATUS.BAD_REQUEST);
      }

      if (!validReportPeriod(startDate, endDate)) {
        return sendError(res, 'El período debe contener fechas válidas (AAAA-MM-DD) en orden cronológico', HTTP_STATUS.BAD_REQUEST);
      }

      const revenue = await Payment.getRevenueByPeriod(startDate, endDate, method || null);

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
      const { startDate, endDate, method } = req.query;
      if (method && !require('../validators/listValidator').methods.includes(method)) return sendError(res, 'Método no válido', 400);

      if (!startDate || !endDate) {
        return sendError(res, 'Fechas de inicio y fin requeridas', HTTP_STATUS.BAD_REQUEST);
      }

      if (!validReportPeriod(startDate, endDate)) {
        return sendError(res, 'El período debe contener fechas válidas (AAAA-MM-DD) en orden cronológico', HTTP_STATUS.BAD_REQUEST);
      }

      const revenue = await Payment.getRevenueByMethod(startDate, endDate, method || null);

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