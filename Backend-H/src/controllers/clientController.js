const Client = require('../models/Client');
const Reservation = require('../models/Reservation');
const { sendSuccess, sendCreated, sendUpdated, sendDeleted, sendError, 
        sendPaginated } = require('../utils/response');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, HTTP_STATUS } = require('../config/constants');
const { formatDate } = require('../utils/helpers');

class ClientController {
  /**
   * Crear nuevo cliente
   */
  static async create(req, res, next) {
    try {
      const {
        name, document, document_type, email, phone,
        address, city, country, nationality, date_of_birth,
        gender, emergency_contact, emergency_phone
      } = req.body;

      // Validaciones
      if (!name || !document) {
        return sendError(res, 'Nombre y documento son requeridos', HTTP_STATUS.BAD_REQUEST);
      }

      // Verificar si documento ya existe
      const existingClient = await Client.findByDocument(document);
      if (existingClient) {
        return sendError(res, ERROR_MESSAGES.DOCUMENT_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
      }

      // Crear cliente
      const client = await Client.create({
        name, document, document_type, email, phone,
        address, city, country, nationality, date_of_birth,
        gender, emergency_contact, emergency_phone
      });

      sendCreated(res, client, SUCCESS_MESSAGES.CLIENT_CREATED);
    } catch (error) {
      if (error.message.includes('documento')) {
        return sendError(res, ERROR_MESSAGES.DOCUMENT_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
      }
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

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

      const clients = await Client.findAll(limit, offset);
      const total = await Client.countAll();

      sendPaginated(res, clients, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar cliente
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, email, phone, address, city, country, emergency_contact, emergency_phone } = req.body;

      // Verificar que existe
      const client = await Client.findById(id);
      if (!client) {
        return sendError(res, ERROR_MESSAGES.CLIENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      // Actualizar
      const updatedClient = await Client.update(id, {
        name, email, phone, address, city, country, emergency_contact, emergency_phone
      });

      sendUpdated(res, updatedClient, SUCCESS_MESSAGES.CLIENT_UPDATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar cliente
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const client = await Client.findById(id);
      if (!client) {
        return sendError(res, ERROR_MESSAGES.CLIENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      await Client.delete(id);

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

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

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

      const limit = Math.min(parseInt(pageSize) || 10, 100);
      const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

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
        stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClientController;