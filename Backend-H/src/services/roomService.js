const { transaction } = require('../config/database');
const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const Reservation = require('../models/Reservation');
const error = require('../utils/domainError');
const audit = require('./auditService');

module.exports = {
  update: (id, data, actor) =>
    transaction(async (client) => {
      const room = await Room.findById(id, client, true);
      if (!room) throw error('Habitación no encontrada', 404);
      if (data.room_type_id !== undefined && data.room_type_id !== room.room_type_id) {
        if (!(await RoomType.findById(data.room_type_id, client)))
          throw error('Tipo de habitación no encontrado', 404);
      }
      const next = { ...room, ...data };
      const state = await Reservation.getRoomState(id, client);
      if (next.status !== room.status) {
        if (state.occupied)
          throw error('Registra la salida antes de cambiar el estado de la habitación');
        if (next.status === 'occupied') throw error('Utiliza check-in para ocupar la habitación');
        const derived = state.reserved ? 'reserved' : 'available';
        if (next.status !== 'maintenance' && next.status !== derived) {
          throw error('El estado solicitado no coincide con las reservas de la habitación');
        }
      }
      if (
        data.room_type_id !== undefined &&
        data.room_type_id !== room.room_type_id &&
        (state.occupied || state.reserved)
      ) {
        throw error('No se puede cambiar el tipo de una habitación con reservas activas');
      }
      const updated = await Room.update(id, next, client);
      await audit(client, actor, 'update', 'room', room, updated);
      return updated;
    }),
};
