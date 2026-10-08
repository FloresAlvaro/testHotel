import { useApiClient } from "./api";
import type { CreateClientRequest, UpdateClientRequest } from "~/types";

export const useClientsService = () => {
  const api = useApiClient();

  const getClients = async (page = 1, pageSize = 10) => {
    return await api.getClients(page, pageSize);
  };

  const getClient = async (id: number) => {
    return await api.getClient(id);
  };

  const getClientHistory = async (clientId: number) => {
    return await api.getClientHistory(clientId);
  };

  const createClient = async (data: CreateClientRequest) => {
    return await api.createClient(data);
  };

  const updateClient = async (id: number, data: UpdateClientRequest) => {
    return await api.updateClient(id, data);
  };

  const deleteClient = async (id: number) => {
    await api.deleteClient(id);
  };

  const searchClients = async (q: string) => {
    return await api.searchClients(q);
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
