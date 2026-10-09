const Client = require('../models/Client');
const database = require('../config/database');
const error = require('../utils/domainError');
const { ERROR_MESSAGES } = require('../config/constants');

module.exports = {
  create: async (data) => {
    if (!data.name || !data.document) throw error('Nombre y documento son requeridos', 400);
    if (await Client.findByDocument(data.document))
      throw error(ERROR_MESSAGES.DOCUMENT_ALREADY_EXISTS, 409);
    return Client.create(data);
  },
  update: (id, data) =>
    database.transaction(async (client) => {
      const current = await Client.findById(id, client, true);
      if (!current) throw error(ERROR_MESSAGES.CLIENT_NOT_FOUND, 404);
      return Client.update(id, { ...current, ...data }, client);
    }),
  remove: (id) =>
    database.transaction(async (client) => {
      if (!(await Client.findById(id, client, true)))
        throw error(ERROR_MESSAGES.CLIENT_NOT_FOUND, 404);
      return Client.delete(id, client);
    }),
};
