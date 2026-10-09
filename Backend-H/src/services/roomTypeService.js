const RoomType = require('../models/RoomType');
const database = require('../config/database');
const error = require('../utils/domainError');
const { ERROR_MESSAGES } = require('../config/constants');

module.exports = {
  create: (data) => RoomType.create(data),
  update: (id, data) =>
    database.transaction(async (client) => {
      const current = await RoomType.findById(id, client, true);
      if (!current) throw error(ERROR_MESSAGES.ROOM_TYPE_NOT_FOUND, 404);
      return RoomType.update(id, { ...current, ...data }, client);
    }),
  deactivate: (id) =>
    database.transaction(async (client) => {
      if (!(await RoomType.findById(id, client, true)))
        throw error(ERROR_MESSAGES.ROOM_TYPE_NOT_FOUND, 404);
      return RoomType.deactivate(id, client);
    }),
};
