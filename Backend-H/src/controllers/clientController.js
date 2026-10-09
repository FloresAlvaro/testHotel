const ClientService = require('../services/clientService');
const Client = require('../models/Client');
const {
  sendSuccess,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendError,
  sendPaginated,
} = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } = require('../config/constants');
const { getPaginationParams } = require('../utils/helpers');

class ClientController {
  /**
   * Crear nuevo cliente
   */
  static async create(req, res, next) {
    try {
      const created = await ClientService.create(req.body);
      sendCreated(res, created, SUCCESS_MESSAGES.CLIENT_CREATED);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500)
        return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  /**
   * Obtener cliente por ID
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const client = await Client.findById(id);

      if (!client) {
        return sendError(res, ERROR_MESSAGES.CLIENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      sendSuccess(res, client);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener todos los clientes
   */
  static async getAll(req, res, next) {
    try {
      const { page = 1, pageSize = 10 } = req.query;

      const { offset, limit, page: currentPage } = getPaginationParams(page, pageSize, 10);

      const clients = await Client.findAll(limit, offset);
      const total = await Client.countAll();

      sendPaginated(res, clients, total, currentPage, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar cliente
   */
  static async update(req, res, next) {
    try {
      const updated = await ClientService.update(req.params.id, req.body);
      sendUpdated(res, updated, SUCCESS_MESSAGES.CLIENT_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar cliente
   */
  static async delete(req, res, next) {
    try {
      await ClientService.remove(req.params.id);
      sendDeleted(res, SUCCESS_MESSAGES.CLIENT_DELETED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar clientes
   */
  static async search(req, res, next) {
    try {
      const { q, page = 1, pageSize = 10 } = req.query;

      if (!q) {
        return sendError(res, 'Término de búsqueda requerido', HTTP_STATUS.BAD_REQUEST);
      }

      const { offset, limit } = getPaginationParams(page, pageSize, 10);

      const clients = await Client.search(q, limit, offset);

      sendSuccess(res, clients);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener historial de reservas del cliente
   */
  static async getReservationHistory(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 10 } = req.query;

      // Verificar que cliente existe
      const client = await Client.findById(id);
      if (!client) {
        return sendError(res, ERROR_MESSAGES.CLIENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const { offset, limit } = getPaginationParams(page, pageSize, 10);

      const reservations = await Client.getReservationHistory(id, limit, offset);

      sendSuccess(res, reservations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas del cliente
   */
  static async getStats(req, res, next) {
    try {
      const { id } = req.params;

      const client = await Client.findById(id);
      if (!client) {
        return sendError(res, ERROR_MESSAGES.CLIENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      const stats = await Client.getStats(id);

      sendSuccess(res, {
        client,
        stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClientController;
