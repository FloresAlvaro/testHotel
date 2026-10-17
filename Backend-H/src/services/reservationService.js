const { transaction } = require('../config/database');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const lockReservation = require('./reservationLock');
const businessError = require('../utils/businessError');
const { cents } = require('../utils/money');
const { isDateBefore } = require('../utils/helpers');

const update = (id, data) => transaction(async (client) => {
  const { reservation, room } = await lockReservation(id, client);
  const status = data.status ?? reservation.status;
  // Check-in/out deben crear/cerrar su registro y actualizar la habitación.
  if (status !== reservation.status && !(reservation.status === 'confirmed' && status === 'cancelled')) {
    throw businessError('Usa las operaciones de check-in/check-out para cambiar el estado');
  }
  if (['cancelled', 'checked_out'].includes(reservation.status)) {
    throw businessError('No se puede editar una reserva finalizada o cancelada');
  }
  const check_in = data.check_in ?? reservation.check_in;
  const check_out = data.check_out ?? reservation.check_out;
  if (!isDateBefore(check_in, check_out)) throw businessError('La salida debe ser posterior a la entrada', 400);
  if (status !== 'cancelled' && await Reservation.hasOverlap(reservation.room_id, check_in, check_out, id, client)) {
    throw businessError('Habitación no disponible para las fechas seleccionadas');
  }
  if (status !== 'cancelled' && room.status === 'maintenance') {
    throw businessError('La habitación está en mantenimiento');
  }
  const total_price = data.total_price ?? reservation.total_price;
  const payments = await Payment.findByReservationId(id, client);
  const paid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + cents(p.amount), 0);
  if (cents(total_price) < paid) throw businessError('El total no puede ser menor que los pagos completados');
  const updated = await Reservation.update(id, {
    check_in, check_out, total_price, status, notes: data.notes ?? reservation.notes
  }, client);
  await Room.syncReservationStatus(reservation.room_id, client);
  return updated;
});

const cancel = (id) => transaction(async (client) => {
  const { reservation } = await lockReservation(id, client);
  if (reservation.status !== 'confirmed') throw businessError('Solo se pueden cancelar reservas confirmadas');
  const cancelled = await Reservation.cancel(id, client);
  await Room.syncReservationStatus(reservation.room_id, client);
  return cancelled;
});

module.exports = { update, cancel };
