/**
 * Constantes globales de la aplicación
 */

// ==================== ROLES ====================
export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  RECEPTIONIST: "receptionist",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.ADMIN]: "Administrador",
  [USER_ROLES.MANAGER]: "Gerente",
  [USER_ROLES.RECEPTIONIST]: "Recepcionista",
};

// ==================== ESTADOS DE HABITACIÓN ====================
export const ROOM_STATUS = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  MAINTENANCE: "maintenance",
  RESERVED: "reserved",
} as const;

export const ROOM_STATUS_LABELS: Record<string, string> = {
  [ROOM_STATUS.AVAILABLE]: "Disponible",
  [ROOM_STATUS.OCCUPIED]: "Ocupada",
  [ROOM_STATUS.MAINTENANCE]: "Mantenimiento",
  [ROOM_STATUS.RESERVED]: "Reservada",
};

export const ROOM_STATUS_COLORS: Record<string, string> = {
  [ROOM_STATUS.AVAILABLE]: "green",
  [ROOM_STATUS.OCCUPIED]: "blue",
  [ROOM_STATUS.MAINTENANCE]: "yellow",
  [ROOM_STATUS.RESERVED]: "orange",
};

// ==================== ESTADOS DE RESERVA ====================
export const RESERVATION_STATUS = {
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  CANCELLED: "cancelled",
} as const;

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  [RESERVATION_STATUS.CONFIRMED]: "Confirmada",
  [RESERVATION_STATUS.CHECKED_IN]: "Check-in",
  [RESERVATION_STATUS.CHECKED_OUT]: "Check-out",
  [RESERVATION_STATUS.CANCELLED]: "Cancelada",
};

export const RESERVATION_STATUS_COLORS: Record<string, string> = {
  [RESERVATION_STATUS.CONFIRMED]: "blue",
  [RESERVATION_STATUS.CHECKED_IN]: "green",
  [RESERVATION_STATUS.CHECKED_OUT]: "gray",
  [RESERVATION_STATUS.CANCELLED]: "red",
};

// ==================== ESTADOS DE PAGO ====================
export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PAYMENT_STATUS.PENDING]: "Pendiente",
  [PAYMENT_STATUS.COMPLETED]: "Completado",
  [PAYMENT_STATUS.FAILED]: "Falló",
  [PAYMENT_STATUS.REFUNDED]: "Reembolsado",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  [PAYMENT_STATUS.PENDING]: "yellow",
  [PAYMENT_STATUS.COMPLETED]: "green",
  [PAYMENT_STATUS.FAILED]: "red",
  [PAYMENT_STATUS.REFUNDED]: "gray",
};

// ==================== MÉTODOS DE PAGO ====================
export const PAYMENT_METHODS = {
  CASH: "cash",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  TRANSFER: "transfer",
  CHECK: "check",
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  [PAYMENT_METHODS.CASH]: "Efectivo",
  [PAYMENT_METHODS.CREDIT_CARD]: "Tarjeta de Crédito",
  [PAYMENT_METHODS.DEBIT_CARD]: "Tarjeta de Débito",
  [PAYMENT_METHODS.TRANSFER]: "Transferencia",
  [PAYMENT_METHODS.CHECK]: "Cheque",
};

// ==================== TIPOS DE PAGO ====================
export const PAYMENT_TYPES = {
  FULL: "full",
  PARTIAL: "partial",
  ADVANCE: "advance",
} as const;

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  [PAYMENT_TYPES.FULL]: "Pago Completo",
  [PAYMENT_TYPES.PARTIAL]: "Pago Parcial",
  [PAYMENT_TYPES.ADVANCE]: "Adelanto",
};

// ==================== TIPOS DE DOCUMENTO ====================
export const DOCUMENT_TYPES = {
  CEDULA: "cedula",
  PASSPORT: "passport",
  LICENSE: "license",
  OTHER: "other",
} as const;

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  [DOCUMENT_TYPES.CEDULA]: "Cédula de Identidad",
  [DOCUMENT_TYPES.PASSPORT]: "Pasaporte",
  [DOCUMENT_TYPES.LICENSE]: "Licencia de Conducir",
  [DOCUMENT_TYPES.OTHER]: "Otro",
};

// ==================== GÉNEROS ====================
export const GENDERS = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
} as const;

export const GENDER_LABELS: Record<string, string> = {
  [GENDERS.MALE]: "Masculino",
  [GENDERS.FEMALE]: "Femenino",
  [GENDERS.OTHER]: "Otro",
};

// ==================== LÍMITES ====================
export const LIMITS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5,
  SEARCH_MIN_LENGTH: 2,
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 100,
  PHONE_MAX_LENGTH: 20,
  DOCUMENT_MAX_LENGTH: 15,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NOTES_MAX_LENGTH: 500,
  ADDRESS_MAX_LENGTH: 200,
} as const;

// ==================== TIEMPOS ====================
export const TIMEOUTS = {
  NOTIFICATION_SUCCESS: 3000,
  NOTIFICATION_ERROR: 5000,
  NOTIFICATION_WARNING: 4000,
  NOTIFICATION_INFO: 3000,
  MODAL_CLOSE_DELAY: 300,
  DEBOUNCE_SEARCH: 500,
  DEBOUNCE_RESIZE: 300,
  API_TIMEOUT: 30000,
} as const;

// ==================== PATRONES DE VALIDACIÓN ====================
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+591|0)?[2-9]\d{7,8}$/,
  DOCUMENT: /^[0-9]{7,8}$/,
  PASSWORD:
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  CREDIT_CARD: /^[0-9]{13,19}$/,
} as const;

// ==================== COLORES ====================
export const COLORS = {
  PRIMARY: "#3b82f6",
  SECONDARY: "#8b5cf6",
  SUCCESS: "#10b981",
  WARNING: "#f59e0b",
  DANGER: "#ef4444",
  INFO: "#0ea5e9",
  LIGHT: "#f3f4f6",
  DARK: "#1f2937",
  GRAY: "#6b7280",
} as const;

// ==================== MENSAJES ====================
export const MESSAGES = {
  ERROR: {
    REQUIRED_FIELD: "Este campo es requerido",
    INVALID_EMAIL: "Email inválido",
    INVALID_PHONE: "Teléfono inválido",
    INVALID_DOCUMENT: "Documento inválido",
    INVALID_DATE: "Fecha inválida",
    DATE_RANGE: "La fecha de fin debe ser posterior a la de inicio",
    WEAK_PASSWORD: "La contraseña es muy débil",
    UNAUTHORIZED: "No tienes permiso para esta acción",
    NOT_FOUND: "Recurso no encontrado",
    SERVER_ERROR: "Error del servidor",
    NETWORK_ERROR: "Error de conexión",
    UNKNOWN: "Ocurrió un error desconocido",
  },
  SUCCESS: {
    CREATED: "Creado exitosamente",
    UPDATED: "Actualizado exitosamente",
    DELETED: "Eliminado exitosamente",
    SAVED: "Guardado exitosamente",
    LOGIN: "Sesión iniciada correctamente",
    LOGOUT: "Sesión cerrada",
  },
  CONFIRM: {
    DELETE: "¿Estás seguro que deseas eliminar esto?",
    LOGOUT: "¿Estás seguro que deseas cerrar sesión?",
    CANCEL_RESERVATION: "¿Estás seguro que deseas cancelar esta reserva?",
  },
} as const;

// ==================== RUTAS ====================
export const ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    SETTINGS: "/admin/settings",
    REPORTS: "/admin/reports",
  },
  MANAGER: {
    DASHBOARD: "/manager/dashboard",
  },
  PUBLIC: {
    HOME: "/",
    CLIENTS: "/clients",
    ROOMS: "/rooms",
    RESERVATIONS: "/reservations",
    PAYMENTS: "/payments",
    CHECKIN: "/checkin",
    REPORTS: "/reports",
  },
} as const;

// ==================== CONFIGURACIÓN ====================
export const CONFIG = {
  APP_NAME: "HotelSys",
  APP_VERSION: "1.0.0",
  API_BASE_URL: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:3000/api",
  JWT_EXPIRY: "24h",
  CURRENCY: "BOB",
  LOCALE: "es-BO",
  TIMEZONE: "America/La_Paz",
  DATE_FORMAT: "DD/MM/YYYY",
  TIME_FORMAT: "HH:mm",
  DATETIME_FORMAT: "DD/MM/YYYY HH:mm",
} as const;

// ==================== HTTPSTATUSAS ====================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ==================== TIPOS DE EVENTOS ====================
export const EVENT_TYPES = {
  RESERVATION_CREATED: "reservation_created",
  RESERVATION_CANCELLED: "reservation_cancelled",
  CHECKIN_COMPLETED: "checkin_completed",
  CHECKOUT_COMPLETED: "checkout_completed",
  PAYMENT_COMPLETED: "payment_completed",
  PAYMENT_FAILED: "payment_failed",
  ROOM_AVAILABLE: "room_available",
  ROOM_MAINTENANCE: "room_maintenance",
} as const;
