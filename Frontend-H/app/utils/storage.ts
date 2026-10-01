import type { User } from "~/types";

/**
 * Funciones para manejar localStorage y sessionStorage
 */

// ==================== LOCAL STORAGE ====================

/**
 * Guardar en localStorage
 */
export const setLocalStorage = (key: string, value: unknown): void => {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error guardando en localStorage (${key}):`, error);
  }
};

/**
 * Obtener de localStorage
 */
export const getLocalStorage = <T = unknown>(
  key: string,
  defaultValue?: T,
): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : (defaultValue ?? null);
  } catch (error) {
    console.error(`Error leyendo de localStorage (${key}):`, error);
    return defaultValue ?? null;
  }
};

/**
 * Eliminar de localStorage
 */
export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error eliminando de localStorage (${key}):`, error);
  }
};

/**
 * Limpiar localStorage
 */
export const clearLocalStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error limpiando localStorage:", error);
  }
};

/**
 * Obtener todas las claves de localStorage
 */
export const getLocalStorageKeys = (): string[] => {
  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error("Error obteniendo claves de localStorage:", error);
    return [];
  }
};

/**
 * Verificar si existe una clave en localStorage
 */
export const hasLocalStorage = (key: string): boolean => {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
};

/**
 * Guardar objeto con expiración en localStorage
 */
export const setLocalStorageWithExpiry = (
  key: string,
  value: unknown,
  expiryMs: number,
): void => {
  try {
    const item = {
      value,
      expiry: Date.now() + expiryMs,
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(
      `Error guardando en localStorage con expiración (${key}):`,
      error,
    );
  }
};

/**
 * Obtener de localStorage verificando expiración
 */
export const getLocalStorageWithExpiry = <T = unknown>(
  key: string,
): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item) as { expiry?: number; value: T };

    // Verificar si expiró
    if (parsed.expiry && Date.now() > parsed.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch (error) {
    console.error(
      `Error leyendo de localStorage con expiración (${key}):`,
      error,
    );
    return null;
  }
};

// ==================== SESSION STORAGE ====================

/**
 * Guardar en sessionStorage
 */
export const setSessionStorage = (key: string, value: unknown): void => {
  try {
    const serialized = JSON.stringify(value);
    sessionStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error guardando en sessionStorage (${key}):`, error);
  }
};

/**
 * Obtener de sessionStorage
 */
export const getSessionStorage = <T = unknown>(
  key: string,
  defaultValue?: T,
): T | null => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : (defaultValue ?? null);
  } catch (error) {
    console.error(`Error leyendo de sessionStorage (${key}):`, error);
    return defaultValue ?? null;
  }
};

/**
 * Eliminar de sessionStorage
 */
export const removeSessionStorage = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Error eliminando de sessionStorage (${key}):`, error);
  }
};

/**
 * Limpiar sessionStorage
 */
export const clearSessionStorage = (): void => {
  try {
    sessionStorage.clear();
  } catch (error) {
    console.error("Error limpiando sessionStorage:", error);
  }
};

// ==================== CONSTANTES DE CLAVES ====================

export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: "auth_token",
  AUTH_USER: "auth_user",
  AUTH_REFRESH_TOKEN: "auth_refresh_token",

  // UI
  THEME: "theme",
  SIDEBAR_STATE: "sidebar_state",
  LANGUAGE: "language",

  // Data
  CLIENTS: "clients_cache",
  ROOMS: "rooms_cache",
  RESERVATIONS: "reservations_cache",

  // Preferences
  USER_PREFERENCES: "user_preferences",
  RECENT_SEARCHES: "recent_searches",

  // Temporal
  REDIRECT_URL: "redirect_url",
  FORM_DRAFT: "form_draft",
} as const;

// ==================== FUNCIONES DE CONVENIENCIA ====================

/**
 * Guardar token de autenticación
 */
export const saveAuthToken = (token: string): void => {
  setLocalStorage(STORAGE_KEYS.AUTH_TOKEN, token);
};

/**
 * Obtener token de autenticación
 */
export const getAuthToken = (): string | null => {
  return getLocalStorage<string>(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Guardar usuario
 */
export const saveAuthUser = (user: User): void => {
  setLocalStorage(STORAGE_KEYS.AUTH_USER, user);
};

/**
 * Obtener usuario
 */
export const getAuthUser = (): User | null => {
  return getLocalStorage<User>(STORAGE_KEYS.AUTH_USER);
};

/**
 * Limpiar datos de autenticación
 */
export const clearAuthStorage = (): void => {
  removeLocalStorage(STORAGE_KEYS.AUTH_TOKEN);
  removeLocalStorage(STORAGE_KEYS.AUTH_USER);
  removeLocalStorage(STORAGE_KEYS.AUTH_REFRESH_TOKEN);
};

/**
 * Guardar tema
 */
export const saveTheme = (theme: "light" | "dark"): void => {
  setLocalStorage(STORAGE_KEYS.THEME, theme);
};

/**
 * Obtener tema
 */
export const getTheme = (): "light" | "dark" | null => {
  return getLocalStorage<"light" | "dark">(STORAGE_KEYS.THEME);
};

/**
 * Guardar URL de redirección
 */
export const saveRedirectUrl = (url: string): void => {
  setSessionStorage(STORAGE_KEYS.REDIRECT_URL, url);
};

/**
 * Obtener y limpiar URL de redirección
 */
export const getAndClearRedirectUrl = (): string | null => {
  const url = getSessionStorage<string>(STORAGE_KEYS.REDIRECT_URL);
  removeSessionStorage(STORAGE_KEYS.REDIRECT_URL);
  return url;
};

/**
 * Guardar borrador de formulario
 */
export const savFormDraft = (formName: string, data: unknown): void => {
  const key = `${STORAGE_KEYS.FORM_DRAFT}_${formName}`;
  setLocalStorageWithExpiry(key, data, 24 * 60 * 60 * 1000); // 24 horas
};

/**
 * Obtener borrador de formulario
 */
export const getFormDraft = (formName: string): unknown | null => {
  const key = `${STORAGE_KEYS.FORM_DRAFT}_${formName}`;
  return getLocalStorageWithExpiry(key);
};

/**
 * Limpiar borrador de formulario
 */
export const clearFormDraft = (formName: string): void => {
  const key = `${STORAGE_KEYS.FORM_DRAFT}_${formName}`;
  removeLocalStorage(key);
};
