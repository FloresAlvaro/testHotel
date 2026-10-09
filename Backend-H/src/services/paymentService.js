const { transaction } = require('../config/database');
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const error = require('../utils/domainError');
const audit = require('./auditService');
const transitions = {
  pending: ['pending', 'completed', 'failed'],
  completed: ['completed', 'refunded'],
  failed: ['failed', 'pending'],
  refunded: ['refunded'],
};
const { cents } = require('../utils/money');
const assertBalance = async (reservation, amount, client) => {
  const payments = await Payment.findByReservationId(reservation.id, client);
  const paid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + cents(p.amount), 0);
  if (paid + cents(amount) > cents(reservation.total_price))
    throw error('El pago supera el saldo de la reserva');
};
const withPayment = (id, callback) =>
  transaction(async (client) => {
    const found = await Payment.findById(id, client);
    if (!found) throw error('Pago no encontrado', 404);
    const reservation = await Reservation.findById(found.reservation_id, client, true);
    if (!reservation) throw error('Reserva no encontrada', 404);
    const payment = await Payment.findById(id, client, true);
    return callback(client, payment, reservation);
  });

module.exports = {
  create: (data, actor) =>
    transaction(async (client) => {
      const reservation = await Reservation.findById(data.reservation_id, client, true);
      if (!reservation) throw error('Reserva no encontrada', 404);
      if (reservation.status === 'cancelled')
        throw error('No se pueden registrar pagos para una reserva cancelada');
      await assertBalance(reservation, data.amount, client);
      const created = await Payment.create(
        { ...data, type: data.type || 'full', status: 'pending' },
        client,
      );
      await audit(client, actor, 'create', 'payment', null, created);
      return created;
    }),
  update: (id, data, actor) =>
    withPayment(id, async (client, payment, reservation) => {
      if (payment.status !== 'pending') throw error('Solo se pueden editar pagos pendientes');
      if (reservation.status === 'cancelled') throw error('La reserva está cancelada');
      await assertBalance(reservation, data.amount ?? payment.amount, client);
      const updated = await Payment.update(
        id,
        { ...payment, ...data, status: payment.status },
        client,
      );
      await audit(client, actor, 'update', 'payment', payment, updated);
      return updated;
    }),
  changeStatus: (id, status, actor, expectedStatus = null) =>
    withPayment(id, async (client, payment, reservation) => {
      if (expectedStatus && payment.status !== expectedStatus)
        throw error('El estado actual del pago no permite esta operación');
      if (!transitions[payment.status]?.includes(status))
        throw error('Transición de estado de pago no permitida');
      if (status === 'completed' && payment.status !== 'completed') {
        if (reservation.status === 'cancelled') throw error('La reserva está cancelada');
        await assertBalance(reservation, payment.amount, client);
      }
      const updated = await Payment.updateStatus(id, status, client);
      await audit(client, actor, 'status', 'payment', payment, updated);
      return updated;
    }),
};
