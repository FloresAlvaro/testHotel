import type {
  ApiResponse,
  Invitation,
  InviteRequest,
  AccountSession,
  CheckInLogData,
  Client,
  ClientStats,
  CreateClientRequest,
  CreatePaymentRequest,
  CreateReservationRequest,
  CreateRoomRequest,
  LoginRequest,
  LoginResponse,
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

  // Configurar cliente HTTP con $fetch
  const api = $fetch.create({
    baseURL: import.meta.server
      ? config.apiInternalBase
      : config.public.apiBase,
    credentials: "include",
    retry: 1,

    // Interceptor de request
    onRequest({ request, options }) {
      const token = authStore.token;
      if (token) {
        const headers = new Headers(options.headers);
        headers.set("Authorization", `Bearer ${token}`);
        options.headers = headers;
      }

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
    onResponseError({ response }) {
      const requestId = response.headers.get("X-Request-ID") || response._data?.requestId;
      console.error(
        `[API Error] ${response.status}${requestId ? ` [${requestId}]` : ""}:`,
        response._data?.message || response.statusText,
      );

      // Manejar errores comunes
      if (response.status === 401) {
        authStore.logout();
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
      api<ApiResponse<LoginResponse>>("/users/login", {
        method: "POST",
        body: data,
        retry: 0,
      }),

    register: (data: Pick<RegisterRequest, "name" | "email" | "password">) =>
      api<ApiResponse<LoginResponse>>("/users/register", {
        method: "POST",
        body: data,
      }),

    inviteUser: (data: InviteRequest) => api<ApiResponse<Invitation>>('/account/invitations', { method: 'POST', body: data, retry: 0 }),
    acceptInvitation: (data: { token: string; password: string; confirmPassword: string }) => api<ApiResponse<null>>('/account/accept-invitation', { method: 'POST', body: data, retry: 0 }),
    forgotPassword: (email: string) => api<ApiResponse<null>>('/account/forgot-password', { method: 'POST', body: { email }, retry: 0 }),
    resetPassword: (data: { token: string; password: string; confirmPassword: string }) => api<ApiResponse<null>>('/account/reset-password', { method: 'POST', body: data, retry: 0 }),
    logoutSession: () => api<ApiResponse<null>>('/account/logout', { method: 'POST', retry: 0 }),
    logoutAllSessions: () => api<ApiResponse<null>>('/account/logout-all', { method: 'POST', retry: 0 }),
    getSessions: () => api<ApiResponse<AccountSession[]>>('/account/sessions'),
    revokeSession: (id: string) => api<ApiResponse<null>>(`/account/sessions/${id}`, { method: 'DELETE', retry: 0 }),
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

    getRevenueByPeriod: (startDate: string, endDate: string) =>
      api<ApiResponse<RevenueReport[]>>(
        `/payments/revenue/period?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      ),

    getRevenueByMethod: (startDate: string, endDate: string) =>
      api<ApiResponse<RevenueByMethod[]>>(
        `/payments/revenue/method?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      ),

    // ==================== CLIENTES ====================
    getClients: (page = 1, pageSize = 10) =>
      api<PaginatedApiResponse<Client>>(
        `/clients?page=${page}&pageSize=${pageSize}`,
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
    getRoomTypes: (page = 1, pageSize = 10) =>
      api<PaginatedApiResponse<RoomType>>(
        `/room-types?page=${page}&pageSize=${pageSize}`,
      ),

    getRoomType: (id: number) =>
      api<ApiResponse<RoomType>>(`/room-types/${id}`),

    // ==================== RESERVAS ====================
    getReservations: (page = 1, pageSize = 10, status?: ReservationStatus) =>
      api<PaginatedApiResponse<Reservation>>(
        `/reservations?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ""}`,
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
    getPayments: (page = 1, pageSize = 10, status?: Payment["status"]) =>
      api<PaginatedApiResponse<Payment>>(
        `/payments?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ""}`,
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
