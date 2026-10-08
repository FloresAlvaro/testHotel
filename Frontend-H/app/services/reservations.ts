import { useApiClient } from "./api";
import type {
  ReservationStatus,
  CreateReservationRequest,
  UpdateReservationRequest,
} from "~/types";

export const useReservationsService = () => {
  const api = useApiClient();

  const getReservations = async (
    page = 1,
    pageSize = 10,
    status?: ReservationStatus,
  ) => {
    return await api.getReservations(page, pageSize, status);
  };

  const getReservation = async (id: number) => {
    return await api.getReservation(id);
  };

  const createReservation = async (data: CreateReservationRequest) => {
    return await api.createReservation(data);
  };

  const updateReservation = async (
    id: number,
    data: UpdateReservationRequest,
  ) => {
    return await api.updateReservation(id, data);
  };

  const cancelReservation = async (id: number) => {
    return await api.cancelReservation(id);
  };

  return {
    getReservations,
    getReservation,
    createReservation,
    updateReservation,
    cancelReservation,
  };
};
