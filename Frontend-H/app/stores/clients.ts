import { defineStore } from "pinia";
import { useApiClient } from "../services/api";
import { getErrorMessage } from "~/utils/errors";
import type { Client, CreateClientRequest, UpdateClientRequest } from "~/types";

export const useClientsStore = defineStore("clients", () => {
  const api = useApiClient();

  // State
  const clients = ref<Client[]>([]);
  const currentClient = ref<Client | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Computed
  const hasClients = computed(() => clients.value.length > 0);
  const totalClients = computed(() => pagination.value.total);

  // Actions
  const fetchClients = async (page = 1, pageSize = 10) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getClients(page, pageSize);

      if (response.data) {
        clients.value = response.data;
      }

      if (response.pagination) {
        pagination.value = {
          page: response.pagination.page,
          pageSize: response.pagination.pageSize,
          total: response.pagination.total,
          totalPages: response.pagination.totalPages,
        };
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando clientes");
      console.error("Error fetchClients:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchClient = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getClient(id);

      if (response.data) {
        currentClient.value = response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando cliente");
      console.error("Error fetchClient:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createClient = async (data: CreateClientRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.createClient(data);

      if (response.data) {
        clients.value.unshift(response.data);
        pagination.value.total += 1;
        return response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error creando cliente");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateClient = async (id: number, data: UpdateClientRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.updateClient(id, data);

      if (response.data) {
        const index = clients.value.findIndex((c) => c.id === id);
        if (index !== -1) {
          clients.value[index] = response.data;
        }
        if (currentClient.value?.id === id) {
          currentClient.value = response.data;
        }
        return response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error actualizando cliente");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteClient = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      await api.deleteClient(id);
      clients.value = clients.value.filter((c) => c.id !== id);
      pagination.value.total -= 1;

      if (currentClient.value?.id === id) {
        currentClient.value = null;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error eliminando cliente");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const searchClients = async (searchTerm: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.searchClients(searchTerm);

      if (response.data) {
        clients.value = response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error buscando clientes");
      console.error("Error searchClients:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    clients.value = [];
    currentClient.value = null;
    loading.value = false;
    error.value = null;
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    };
  };

  return {
    // State
    clients,
    currentClient,
    loading,
    error,
    pagination,

    // Computed
    hasClients,
    totalClients,

    // Methods
    fetchClients,
    fetchClient,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
    clearError,
    reset,
  };
});
