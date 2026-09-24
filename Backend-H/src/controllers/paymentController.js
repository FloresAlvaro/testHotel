const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const { sendSuccess, sendCreated, sendUpdated, sendError, 
        sendPaginated, sendPaymentSuccess } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS, PAYMENT_STATUS } = require('../config/constants');

class PaymentController {
  /**
   * Crear pago
   */
  static async create(req, res, next) {
    try {
      const { reservation_id, amount, type, method, transaction_id, notes } = req.body;

      // Validaciones
      if (!reservation_id || !amount || !method) {
        return sendError(res, 'Campos requeridos faltantes', HTTP_STATUS.BAD_REQUEST);
      }

      if (amount <= 0) {
        return sendError(res, ERROR_MESSAGES.INVALID_PAYMENT_AMOUNT, HTTP_STATUS.BAD_REQUEST);
      }

      // Verificar que reserva existe
      const reservation = await Reservation.findById(reservation_id);
      if (!reservation) {
        return sendError(res, ERROR_MESSAGES.RESERVATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      // Validar que no exceda el monto de la reserva
      const existingPayments = await Payment.findByReservationId(reservation_id);
      const totalPaid = existingPayments.reduce(
        (sum, payment) => sum + (
          payment.status === PAYMENT_STATUS.COMPLETED
            ? Number(payment.amount)
            : 0
        ),
        0
      );
      const numericAmount = Number(amount);
      const reservationTotal = Number(reservation.total_price);

      if (totalPaid + numericAmount > reservationTotal) {
        return sendError(res, ERROR_MESSAGES.INSUFFICIENT_AMOUNT, HTTP_STATUS.BAD_REQUEST);
      }

      // Crear pago
      const payment = await Payment.create({
        reservation_id,
        amount: numericAmount,
        type: type || 'full',
        method,
        status: PAYMENT_STATUS.PENDING,
        transaction_id,
        notes
      });

      sendPaymentSuccess(res, payment);
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

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

      const payments = await Payment.findAll(limit, offset, status);
      const total = await Payment.countAll(status);

      sendPaginated(res, payments, total, page, limit);
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
   * Actualizar estado de pago
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const payment = await Payment.findById(id);
      if (!payment) {
        return sendError(res, ERROR_MESSAGES.PAYMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const allowedTransitions = {
        pending: ['pending', 'completed', 'failed'],
        completed: ['completed', 'refunded'],
        failed: ['failed', 'pending'],
        refunded: ['refunded']
      };

      if (!allowedTransitions[payment.status].includes(status)) {
        return sendError(res, 'Transición de estado de pago no permitida', HTTP_STATUS.CONFLICT);
      }

      const updated = await Payment.updateStatus(id, status);

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
      const { id } = req.params;

      const payment = await Payment.findById(id);
      if (!payment) {
        return sendError(res, ERROR_MESSAGES.PAYMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      if (payment.status !== PAYMENT_STATUS.PENDING) {
        return sendError(res, 'Solo se pueden completar pagos pendientes', HTTP_STATUS.CONFLICT);
      }

      const completed = await Payment.updateStatus(id, PAYMENT_STATUS.COMPLETED);

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
      const { id } = req.params;
      const { reason } = req.body;

      const payment = await Payment.findById(id);
      if (!payment) {
        return sendError(res, ERROR_MESSAGES.PAYMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      if (payment.status !== PAYMENT_STATUS.COMPLETED) {
        return sendError(res, 'Solo se pueden reembolsar pagos completados', HTTP_STATUS.CONFLICT);
      }

      const refunded = await Payment.updateStatus(id, PAYMENT_STATUS.REFUNDED);

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

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

      const payments = await Payment.findPending(limit, offset);

      sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentController;