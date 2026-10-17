const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const businessError = require('../utils/businessError');

// Orden compartido por reservas y check-in/out: habitación, después reserva.
module.exports = async (id, client) => {
  const snapshot = await Reservation.findById(id, client);
  if (!snapshot) throw businessError('Reserva no encontrada', 404);
  const room = await Room.findById(snapshot.room_id, client, true);
  if (!room) throw businessError('Habitación no encontrada', 404);
  const reservation = await Reservation.findById(id, client, true);
  if (!reservation) throw businessError('Reserva no encontrada', 404);
  return { reservation, room };
};
