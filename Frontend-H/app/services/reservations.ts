import { useApiClient } from "./api";
import type {
  ReservationStatus,
  CreateReservationRequest,
  UpdateReservationRequest,
} from "~/types";

export const useReservationsService = () => {
  const api = useApiClient();
  const uiStore = useUiStore();

  const getReservations = async (
    page = 1,
    pageSize = 10,
    status?: ReservationStatus,
  ) => {
    try {
      return await api.getReservations(page, pageSize, status);
    } catch (error) {
      console.error("Error cargando reservas:", error);
      throw error;
    }
  };

  const getReservation = async (id: number) => {
    try {
      return await api.getReservation(id);
    } catch (error) {
      console.error("Error cargando reserva:", error);
      throw error;
    }
  };

  const createReservation = async (data: CreateReservationRequest) => {
    try {
      const response = await api.createReservation(data);
      uiStore.success("Reserva creada correctamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al crear reserva");
      throw error;
    }
  };

  const updateReservation = async (
    id: number,
    data: UpdateReservationRequest,
  ) => {
    try {
      const response = await api.updateReservation(id, data);
      uiStore.success("Reserva actualizada correctamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al actualizar reserva");
      throw error;
    }
  };

  const cancelReservation = async (id: number) => {
    try {
      const response = await api.cancelReservation(id);
      uiStore.success("Reserva cancelada correctamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al cancelar reserva");
      throw error;
    }
  };

  return {
    getReservations,
    getReservation,
    createReservation,
    updateReservation,
    cancelReservation,
  };
};
