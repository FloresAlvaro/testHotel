import { useClientsService } from "../services/clients";
import type { CreateClientRequest, UpdateClientRequest } from "~/types";

export const useClients = () => {
  const clientsStore = useClientsStore();
  const clientsService = useClientsService();
  const uiStore = useUiStore();

  // ==================== STATE ====================
  const clients = computed(() => clientsStore.clients);
  const currentClient = computed(() => clientsStore.currentClient);
  const loading = computed(() => clientsStore.loading);
  const error = computed(() => clientsStore.error);
  const pagination = computed(() => clientsStore.pagination);

  // ==================== BÚSQUEDA ====================
  const searchQuery = ref("");
  const filteredClients = computed(() => {
    if (!searchQuery.value) return clients.value;

    const query = searchQuery.value.toLowerCase();
    return clients.value.filter(
      (client) =>
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.includes(query) ||
        client.document?.includes(query),
    );
  });

  // ==================== MÉTODOS ====================

  /**
   * Cargar lista de clientes con paginación
   */
  const fetchClients = async (page = 1, pageSize = 10) => {
    try {
      await clientsStore.fetchClients(page, pageSize);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      throw error;
    }
  };

  /**
   * Cargar cliente por ID
   */
  const fetchClient = async (id: number) => {
    try {
      await clientsStore.fetchClient(id);
    } catch (error) {
      console.error("Error cargando cliente:", error);
      throw error;
    }
  };

  /**
   * Crear nuevo cliente
   */
  const createClient = async (data: CreateClientRequest) => {
    try {
      const response = await clientsStore.createClient(data);
      uiStore.success(`Cliente ${data.name} registrado exitosamente`);
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al registrar cliente");
      throw error;
    }
  };

  /**
   * Actualizar cliente
   */
  const updateClient = async (id: number, data: UpdateClientRequest) => {
    try {
      const response = await clientsStore.updateClient(id, data);
      uiStore.success("Cliente actualizado exitosamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al actualizar cliente");
      throw error;
    }
  };

  /**
   * Eliminar cliente
   */
  const deleteClient = async (id: number) => {
    try {
      await clientsStore.deleteClient(id);
      uiStore.success("Cliente eliminado exitosamente");
    } catch (error: unknown) {
      uiStore.error("Error al eliminar cliente");
      throw error;
    }
  };

  /**
   * Buscar clientes
   */
  const searchClients = async (query: string) => {
    searchQuery.value = query;

    if (!query.trim()) {
      await fetchClients();
      return;
    }

    try {
      await clientsStore.searchClients(query);
    } catch (error) {
      console.error("Error buscando clientes:", error);
      throw error;
    }
  };

  /**
   * Obtener historial de reservas de un cliente
   */
  const getClientReservations = async (clientId: number) => {
    try {
      return await clientsService.getClientHistory(clientId);
    } catch (error) {
      console.error("Error obteniendo reservas del cliente:", error);
      throw error;
    }
  };

  /**
   * Limpiar búsqueda
   */
  const clearSearch = () => {
    searchQuery.value = "";
  };

  /**
   * Ir a página siguiente
   */
  const nextPage = async () => {
    const nextPage = pagination.value.page + 1;
    if (nextPage <= pagination.value.totalPages) {
      await fetchClients(nextPage, pagination.value.pageSize);
    }
  };

  /**
   * Ir a página anterior
   */
  const prevPage = async () => {
    const prevPage = pagination.value.page - 1;
    if (prevPage > 0) {
      await fetchClients(prevPage, pagination.value.pageSize);
    }
  };

  /**
   * Ir a página específica
   */
  const goToPage = async (page: number) => {
    if (page > 0 && page <= pagination.value.totalPages) {
      await fetchClients(page, pagination.value.pageSize);
    }
  };

  /**
   * Cambiar tamaño de página
   */
  const changePageSize = async (size: number) => {
    await fetchClients(1, size);
  };

  return {
    // State
    clients,
    currentClient,
    loading,
    error,
    pagination,
    searchQuery: readonly(searchQuery),
    filteredClients,

    // Methods
    fetchClients,
    fetchClient,
    createClient,
    updateClient,
    deleteClient,
    searchClients,
    clearSearch,
    getClientReservations,
    nextPage,
    prevPage,
    goToPage,
    changePageSize,
  };
};
