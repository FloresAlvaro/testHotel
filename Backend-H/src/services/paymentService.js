const { transaction } = require('../config/database');
const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const businessError = require('../utils/businessError');
const { cents } = require('../utils/money');

const assertBalance = async (reservation, amount, excludeId, client) => {
  if (reservation.status === 'cancelled') throw businessError('No se puede cobrar una reserva cancelada');
  const payments = await Payment.findByReservationId(reservation.id, client);
  const paid = payments.filter(p => p.status === 'completed' && String(p.id) !== String(excludeId))
    .reduce((sum, p) => sum + cents(p.amount), 0);
  const requested = cents(amount);
  if (requested <= 0) throw businessError('El importe debe ser mayor que cero', 400);
  if (paid + requested > cents(reservation.total_price)) {
    throw businessError('El importe supera el saldo pendiente de la reserva', 409);
  }
};

// Serializar por reserva permite comprobar el saldo entre pagos distintos.
const withPayment = (id, action) => transaction(async (client) => {
  const snapshot = await Payment.findById(id, client);
  if (!snapshot) throw businessError('Pago no encontrado', 404);
  const reservation = await Reservation.findById(snapshot.reservation_id, client, true);
  if (!reservation) throw businessError('Reserva no encontrada', 404);
  const payment = await Payment.findById(id, client, true);
  if (!payment) throw businessError('Pago no encontrado', 404);
  if(payment.transaction_id?.startsWith('demo:') || (await client.query('SELECT 1 FROM online_payment WHERE payment_id=$1',[id])).rowCount) throw businessError('Gestiona este pago desde Pagos en línea; su estado lo confirma la pasarela',409);
  return action(payment, reservation, client);
});

const create = (data) => transaction(async (client) => {
  const reservation = await Reservation.findById(data.reservation_id, client, true);
  if (!reservation) throw businessError('Reserva no encontrada', 404);
  await assertBalance(reservation, data.amount, null, client);
  return Payment.create({ ...data, type: data.type || 'full', status: 'pending' }, client);
});

const update = (id, data) => withPayment(id, async (payment, reservation, client) => {
  if (payment.status !== 'pending') throw businessError('Solo se pueden editar pagos pendientes');
  const amount = data.amount ?? payment.amount;
  await assertBalance(reservation, amount, id, client);
  return Payment.update(id, { ...payment, ...data, amount, status: payment.status }, client);
});

const changeStatus = (id, status, requiredStatus) => withPayment(id, async (payment, reservation, client) => {
  if (requiredStatus && payment.status !== requiredStatus) throw businessError('El estado actual del pago no permite esta operación');
  const transitions = {
    pending: ['pending', 'completed', 'failed'],
    completed: ['completed', 'refunded'],
    failed: ['failed', 'pending'],
    refunded: ['refunded']
  };
  if (!transitions[payment.status]?.includes(status)) throw businessError('Transición de estado de pago no permitida');
  if (status === payment.status) return payment;
  if (status === 'completed' || status === 'pending') await assertBalance(reservation, payment.amount, id, client);
  return Payment.updateStatus(id, status, client);
});

module.exports = { create, update, changeStatus };
