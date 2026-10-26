import type { SessionResponse, MfaChallengeResponse, MfaEnrollmentResponse, MfaStatusResponse } from '~/types/generated/api';
import type {
  ApiResponse,
  CheckInLogData,
  Client,
  ClientStats,
  CreateClientRequest,
  CreatePaymentRequest,
  CreateReservationRequest,
  CreateRoomRequest,
  LoginRequest,
  RegisterRequest,
  OccupancyStats,
  PaginatedApiResponse,
  Payment,
  RevenueByMethod,
  RevenueReport,
  Reservation,
  ReservationStatus,
  Room,
  RoomType,
  UpdateClientRequest,
  UpdatePaymentRequest,
  UpdateReservationRequest,
  UpdateRoomRequest,
  User,
} from "~/types";

/**
 * Cliente API base configurado para conectarse al backend Express
 */
export const useApiClient = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const ssrHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined;
  // Configurar cliente HTTP con $fetch
  const api = $fetch.create({
    baseURL: import.meta.server
      ? config.apiInternalBase
      : config.public.apiBase,
    credentials: "include",
    retry: 1,

    // Interceptor de request
    onRequest({ request, options }) {
      const headers = new Headers(options.headers);
      if (ssrHeaders?.cookie) headers.set('cookie', ssrHeaders.cookie);
      headers.set('X-Hotel-Request', '1');
      if(authStore.csrfToken) headers.set('X-Hotel-CSRF', authStore.csrfToken);
      options.headers = headers;

      // Log en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.log(`[API] ${options.method || "GET"} ${request}`);
      }
    },

    // Interceptor de respuesta exitosa
    onResponse({ response }) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[API] Response:`, response.status);
      }
    },

    // Interceptor de errores
    onResponseError({ request, response, options }) {
      const requestId=response.headers.get('X-Request-ID') || response._data?.requestId;
      console.error(`[API Error] ${response.status}${requestId ? ` [${requestId}]` : ''}:`, response._data?.message || 'Error al procesar la solicitud');

      // Manejar errores comunes
      const requestUrl = typeof request === 'string' ? request : request.url;
      const mfaAttempt = options.method === 'POST' && /\/users\/mfa\/(enroll|confirm|verify|renew)(?:\?|$)/.test(requestUrl);
      if (response.status === 401 && !mfaAttempt) {
        authStore.clearSession();
        navigateTo("/auth/login");
      }

      if (response.status === 403) {
        console.error("No tienes permisos para esta acción");
      }

      if (response.status === 404) {
        console.error("Recurso no encontrado");
      }

      if (response.status === 500) {
        console.error("Error del servidor");
      }
    },
  });

  return {
    request: api,
    // ==================== USUARIOS ====================
    login: (data: LoginRequest) =>
      api<SessionResponse | MfaChallengeResponse>("/users/session", {
        method: "POST",
        body: data,
      }),

    enableMfa: (password: string) => api<MfaChallengeResponse>('/users/mfa/enable', {method:'POST',body:{password},retry:0}),
    disableMfa: (password: string, code: string) => api<SessionResponse>('/users/mfa/disable', {method:'POST',body:{password,code},retry:0}),
    getMfaStatus: () => api<MfaStatusResponse>('/users/mfa/status'),
    renewMfa: (password: string, code: string) => api<MfaChallengeResponse>('/users/mfa/renew', {
      method: 'POST', body: { password, code }, retry: 0,
    }),
    enrollMfa: (challengeId: string) => api<MfaEnrollmentResponse>('/users/mfa/enroll', {
      method: 'POST', body: { challengeId }, retry: 0,
    }),
    confirmMfa: (challengeId: string, code: string, recoveryCodesSaved: boolean) => api<SessionResponse>('/users/mfa/confirm', {
      method: 'POST', body: { challengeId, code, recoveryCodesSaved }, retry: 0,
    }),
    verifyMfa: (challengeId: string, code: string) => api<SessionResponse>('/users/mfa/verify', {
      method: 'POST', body: { challengeId, code }, retry: 0,
    }),

    register: (data: Pick<RegisterRequest, "name" | "email" | "password"> & { role?: User["role"] }) =>
      api<ApiResponse<User>>("/users", {
        method: "POST",
        body: data,
      }),

    getUsers: (page = 1, pageSize = 100) =>
      api<PaginatedApiResponse<User>>(
        `/users?page=${page}&pageSize=${pageSize}`,
      ),

    updateUser: (
      id: number,
      data: Pick<User, "name" | "email" | "role" | "is_active">,
    ) => api<ApiResponse<User>>(`/users/${id}`, { method: "PUT", body: data }),

    setUserActive: (id: number, active: boolean) =>
      api<ApiResponse<Pick<User, "id" | "name" | "is_active">>>(
        `/users/${id}/${active ? "activate" : "deactivate"}`,
        { method: "PATCH" },
      ),

    changePassword: (
      id: number,
      data: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
      },
    ) =>
      api<ApiResponse<User>>(`/users/${id}/password`, {
        method: "PATCH",
        body: data,
      }),

    getProfile: () => api<ApiResponse<User>>("/users/profile"),

    getDashboardSummary: (startDate: string, endDate: string) =>
      api<
        ApiResponse<{
          period: { startDate: string; endDate: string };
          occupancy: OccupancyStats;
          reservations: {
            active: Reservation[];
            upcoming: Reservation[];
            total: number;
          };
          checkIns: { pendingCheckOuts: CheckInLogData[] };
          payments: {
            pending: Payment[];
            pendingTotal: number;
            revenue: RevenueReport[];
          };
          clients: { total: number };
        }>
      >(
        `/dashboard?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      ),

    getRevenueByPeriod: (startDate: string, endDate: string, method = '') =>
      api<ApiResponse<RevenueReport[]>>(
        `/payments/revenue/period?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&method=${encodeURIComponent(method)}`,
      ),

    getRevenueByMethod: (startDate: string, endDate: string, method = '') =>
      api<ApiResponse<RevenueByMethod[]>>(
        `/payments/revenue/method?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&method=${encodeURIComponent(method)}`,
      ),

    // ==================== CLIENTES ====================
    getClients: (page = 1, pageSize = 10, q = "") =>
      api<PaginatedApiResponse<Client>>(
        `/clients?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`,
      ),

    getClient: (id: number) => api<ApiResponse<Client>>(`/clients/${id}`),

    createClient: (data: CreateClientRequest) =>
      api<ApiResponse<Client>>("/clients", {
        method: "POST",
        body: data,
      }),

    updateClient: (id: number, data: UpdateClientRequest) =>
      api<ApiResponse<Client>>(`/clients/${id}`, {
        method: "PUT",
        body: data,
      }),

    deleteClient: (id: number) =>
      api<ApiResponse<null>>(`/clients/${id}`, {
        method: "DELETE",
      }),

    searchClients: (q: string) =>
      api<ApiResponse<Client[]>>(`/clients/search?q=${encodeURIComponent(q)}`),

    getClientHistory: (clientId: number) =>
      api<ApiResponse<Reservation[]>>(`/clients/${clientId}/reservations`),

    getClientStats: (clientId: number) =>
      api<ApiResponse<{ client: Client; stats: ClientStats }>>(
        `/clients/${clientId}/stats`,
      ),

    // ==================== HABITACIONES ====================
    getRooms: (page = 1, pageSize = 10, status?: Room["status"]) =>
      api<PaginatedApiResponse<Room>>(
        `/rooms?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ""}`,
      ),

    getRoom: (id: number) => api<ApiResponse<Room>>(`/rooms/${id}`),

    createRoom: (data: CreateRoomRequest) =>
      api<ApiResponse<Room>>("/rooms", {
        method: "POST",
        body: data,
      }),

    updateRoom: (id: number, data: UpdateRoomRequest) =>
      api<ApiResponse<Room>>(`/rooms/${id}`, {
        method: "PUT",
        body: data,
      }),

    getAvailableRooms: (checkIn: string, checkOut: string) =>
      api<ApiResponse<Room[]>>(
        `/rooms/available-for-dates?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`,
      ),

    getOccupancyStatus: () =>
      api<ApiResponse<OccupancyStats>>("/rooms/occupancy"),

    // ==================== TIPOS DE HABITACIÓN ====================
    getRoomTypes: (page = 1, pageSize = 10, q = "") =>
      api<PaginatedApiResponse<RoomType>>(
        `/room-types?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`,
      ),

    getRoomType: (id: number) =>
      api<ApiResponse<RoomType>>(`/room-types/${id}`),

    // ==================== RESERVAS ====================
    getReservations: (page = 1, pageSize = 10, status?: ReservationStatus, q = "") =>
      api<PaginatedApiResponse<Reservation>>(
        `/reservations?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}${status ? `&status=${status}` : ""}`,
      ),

    getReservation: (id: number) =>
      api<ApiResponse<Reservation>>(`/reservations/${id}`),

    createReservation: (data: CreateReservationRequest) =>
      api<ApiResponse<Reservation>>("/reservations", {
        method: "POST",
        body: data,
      }),

    updateReservation: (id: number, data: UpdateReservationRequest) =>
      api<ApiResponse<Reservation>>(`/reservations/${id}`, {
        method: "PUT",
        body: data,
      }),

    cancelReservation: (id: number) =>
      api<ApiResponse<Reservation>>(`/reservations/${id}/cancel`, {
        method: "PATCH",
      }),

    getActiveReservations: () =>
      api<ApiResponse<Reservation[]>>("/reservations/active"),

    getUpcoming: (days = 7) =>
      api<ApiResponse<Reservation[]>>(`/reservations/upcoming?days=${days}`),

    // ==================== CHECK-IN ====================
    checkIn: (reservationId: number, notes?: string) =>
      api<ApiResponse<CheckInLogData>>("/check-in", {
        method: "POST",
        body: { reservation_id: reservationId, notes },
      }),

    checkOut: (reservationId: number) =>
      api<ApiResponse<CheckInLogData>>("/check-in/check-out", {
        method: "POST",
        body: { reservation_id: reservationId },
      }),

    getTodayCheckIns: () =>
      api<ApiResponse<CheckInLogData[]>>("/check-in/today"),

    getPendingCheckOuts: () =>
      api<ApiResponse<CheckInLogData[]>>("/check-in/pending-check-outs"),

    // ==================== PAGOS ====================
    getPayments: (page = 1, pageSize = 10, status?: Payment["status"], filters: Record<string,string|undefined> = {}) =>
      api<PaginatedApiResponse<Payment> & {summary: import('~/composables/useTableList').PaymentSummary}>(
        "/payments", {query:{page,pageSize,status,...filters}},
      ),

    getPayment: (id: number) => api<ApiResponse<Payment>>(`/payments/${id}`),

    createPayment: (data: CreatePaymentRequest) =>
      api<ApiResponse<Payment>>("/payments", {
        method: "POST",
        body: data,
      }),

    updatePayment: (id: number, data: UpdatePaymentRequest) =>
      api<ApiResponse<Payment>>(`/payments/${id}`, {
        method: "PUT",
        body: data,
      }),

    completePayment: (id: number) =>
      api<ApiResponse<Payment>>(`/payments/${id}/complete`, {
        method: "PATCH",
      }),

    refundPayment: (id: number) =>
      api<ApiResponse<Payment>>(`/payments/${id}/refund`, {
        method: "PATCH",
      }),
  };
};
