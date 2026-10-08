import { useApiClient } from "./api";

export const useCheckInService = () => {
  const api = useApiClient();

  const checkIn = async (reservationId: number, notes?: string) => {
    return await api.checkIn(reservationId, notes);
  };

  const checkOut = async (reservationId: number) => {
    return await api.checkOut(reservationId);
  };

  const getTodayCheckIns = async () => {
    return await api.getTodayCheckIns();
  };

  const getPendingCheckOuts = async () => {
    return await api.getPendingCheckOuts();
  };

  return {
    checkIn,
    checkOut,
    getTodayCheckIns,
    getPendingCheckOuts,
  };
};
