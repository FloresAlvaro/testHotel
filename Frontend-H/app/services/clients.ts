import { useApiClient } from "./api";
import type { CreateClientRequest, UpdateClientRequest } from "~/types";

export const useClientsService = () => {
  const api = useApiClient();
  const uiStore = useUiStore();

  const getClients = async (page = 1, pageSize = 10) => {
    try {
      return await api.getClients(page, pageSize);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      throw error;
    }
  };

  const getClient = async (id: number) => {
    try {
      return await api.getClient(id);
    } catch (error) {
      console.error("Error cargando cliente:", error);
      throw error;
    }
  };

  const getClientHistory = async (clientId: number) => {
    try {
      return await api.getClientHistory(clientId);
    } catch (error) {
      console.error("Error cargando historial del cliente:", error);
      throw error;
    }
  };

  const createClient = async (data: CreateClientRequest) => {
    try {
      const response = await api.createClient(data);
      uiStore.success("Cliente registrado correctamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al registrar cliente");
      throw error;
    }
  };

  const updateClient = async (id: number, data: UpdateClientRequest) => {
    try {
      const response = await api.updateClient(id, data);
      uiStore.success("Cliente actualizado correctamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al actualizar cliente");
      throw error;
    }
  };

  const deleteClient = async (id: number) => {
    try {
      await api.deleteClient(id);
      uiStore.success("Cliente eliminado correctamente");
    } catch (error: unknown) {
      uiStore.error("Error al eliminar cliente");
      throw error;
    }
  };

  const searchClients = async (q: string) => {
    try {
      return await api.searchClients(q);
    } catch (error) {
      console.error("Error buscando clientes:", error);
      throw error;
    }
  };

  return {
    getClients,
    getClient,
    getClientHistory,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
  };
};
