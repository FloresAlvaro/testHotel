const { transaction } = require('../config/database');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const CheckInLog = require('../models/CheckInLog');
const { calculateTotalPrice } = require('../utils/helpers');
const error = require('../utils/domainError');
const audit = require('./auditService');

// Todas las operaciones de estancia bloquean primero la habitación y después la reserva.
const withReservation = (id, callback) => transaction(async client => {
  const found = await Reservation.findById(id, client);
  if (!found) throw error('Reserva no encontrada', 404);
  const room = await Room.findById(found.room_id, client, true);
  if (!room) throw error('Habitación no encontrada', 404);
  const reservation = await Reservation.findById(id, client, true);
  return callback(client, reservation, room);
});
const synchronizeRoom = async (room, client) => {
  if (room.status === 'maintenance') return;
  const state = await Reservation.getRoomState(room.id, client);
  return Room.updateStatus(room.id, state.occupied ? 'occupied' : state.reserved ? 'reserved' : 'available', client);
};
const cancel = async (client, reservation, room, actor) => {
  if (reservation.status !== 'confirmed') throw error('Solo se pueden cancelar reservas confirmadas');
  const updated = await Reservation.cancel(reservation.id, client);
  await synchronizeRoom(room, client);
  await audit(client, actor, 'cancel', 'reservation', reservation, updated);
  return updated;
};

module.exports = {
  create: (data, actor) => transaction(async client => {
    if (!await Client.findById(data.client_id, client)) throw error('Cliente no encontrado', 404);
    const room = await Room.findById(data.room_id, client, true);
    if (!room) throw error('Habitación no encontrada', 404);
    const available = await Room.findAvailableForDates(data.check_in, data.check_out, room.room_type_id, client);
    if (!available.some(r => r.id === Number(data.room_id))) throw error('La habitación no está disponible para esas fechas');
    const created = await Reservation.create({ ...data, user_id: actor.id,
      total_price: calculateTotalPrice(room.price, data.check_in, data.check_out) }, client);
    await synchronizeRoom(room, client);
    await audit(client, actor, 'create', 'reservation', null, created);
    return created;
  }),
  update: (id, data, actor) => withReservation(id, async (client, reservation, room) => {
    if (data.status && data.status !== reservation.status) {
      if (data.status === 'cancelled') {
        if (Object.keys(data).some(key => key !== 'status')) throw error('Cancela la reserva sin modificar otros datos', 400);
        return cancel(client, reservation, room, actor);
      }
      throw error('Utiliza el proceso de check-in/out para cambiar el estado de la estancia');
    }
    if (reservation.status === 'cancelled' || reservation.status === 'checked_out') throw error('La reserva ya está cerrada');
    const next = { ...reservation, ...data };
    const dateKey = value => value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
    const start = dateKey(next.check_in), end = dateKey(next.check_out);
    if (start >= end) throw error('La salida debe ser posterior a la entrada', 400);
    const datesChanged = start !== dateKey(reservation.check_in) || end !== dateKey(reservation.check_out);
    if (datesChanged) {
      if (await Reservation.hasOverlap(room.id, start, end, reservation.id, client)) throw error('La habitación ya tiene una reserva para esas fechas');
      if (data.total_price === undefined) next.total_price = calculateTotalPrice(room.price, start, end);
    }
    const payments = await Payment.findByReservationId(id, client);
    const paid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Math.round(Number(p.amount) * 100), 0);
    if (Math.round(Number(next.total_price) * 100) < paid) throw error('El precio no puede ser menor al importe ya pagado');
    const updated = await Reservation.update(id, { ...next, check_in: start, check_out: end }, client);
    await synchronizeRoom(room, client);
    await audit(client, actor, 'update', 'reservation', reservation, updated);
    return updated;
  }),
  cancel: (id, actor) => withReservation(id, (client, reservation, room) => cancel(client, reservation, room, actor)),
  checkIn: (id, notes, actor) => withReservation(id, async (client, reservation, room) => {
    if (reservation.status !== 'confirmed') throw error('Solo se pueden ingresar reservas confirmadas');
    if (room.status === 'maintenance') throw error('La habitación está en mantenimiento');
    if (await Reservation.hasActiveStay(room.id, client)) throw error('La habitación tiene otra estancia activa');
    if (await CheckInLog.findByReservationId(id, client, true)) throw error('La reserva ya tiene un registro de entrada');
    const log = await CheckInLog.create({ reservation_id: id, user_id: actor.id, check_in_time: new Date(), notes }, client);
    const updated = await Reservation.updateStatus(id, 'checked_in', client);
    await Room.updateStatus(room.id, 'occupied', client);
    await audit(client, actor, 'check_in', 'reservation', reservation, updated);
    return log;
  }),
  checkOut: (id, actor) => withReservation(id, async (client, reservation, room) => {
    if (reservation.status !== 'checked_in') throw error('La reserva no tiene una estancia activa');
    const log = await CheckInLog.findByReservationId(id, client, true);
    if (!log) throw error('Registro de entrada no encontrado', 404);
    if (log.check_out_time) throw error('La salida ya está registrada');
    const updatedLog = await CheckInLog.updateCheckOut(log.id, new Date(), client);
    const updated = await Reservation.updateStatus(id, 'checked_out', client);
    await Room.updateStatus(room.id, 'maintenance', client);
    await audit(client, actor, 'check_out', 'reservation', reservation, updated);
    return updatedLog;
  })
};
