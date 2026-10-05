import type { User } from "~/types";

const createStorage = (name: string, getStorage: () => Storage) => {
  const run = <T>(
    errorMessage: string,
    fallback: T,
    operation: (storage: Storage) => T,
    key?: string,
    logError = true,
  ): T => {
    try {
      return operation(getStorage());
    } catch (error) {
      if (logError) {
        const location = key ? ` (${key})` : "";
        console.error(`${errorMessage}${location}:`, error);
      }
      return fallback;
    }
  };

  return {
    set: (key: string, value: unknown) =>
      run(
        `Error guardando en ${name}`,
        undefined,
        (storage) => storage.setItem(key, JSON.stringify(value)),
        key,
      ),
    get: <T>(key: string, defaultValue?: T): T | null =>
      run(
        `Error leyendo de ${name}`,
        defaultValue ?? null,
        (storage) => {
          const item = storage.getItem(key);
          return item ? (JSON.parse(item) as T) : (defaultValue ?? null);
        },
        key,
      ),
    remove: (key: string) =>
      run(
        `Error eliminando de ${name}`,
        undefined,
        (storage) => storage.removeItem(key),
        key,
      ),
    clear: () =>
      run(`Error limpiando ${name}`, undefined, (storage) => storage.clear()),
    keys: () =>
      run(`Error obteniendo claves de ${name}`, [], (storage) =>
        Object.keys(storage),
      ),
    has: (key: string) =>
      run(
        `Error verificando ${name}`,
        false,
        (storage) => storage.getItem(key) !== null,
        key,
        false,
      ),
    setWithExpiry: (key: string, value: unknown, expiryMs: number) =>
      run(
        `Error guardando en ${name} con expiración`,
        undefined,
        (storage) =>
          storage.setItem(
            key,
            JSON.stringify({ value, expiry: Date.now() + expiryMs }),
          ),
        key,
      ),
    getWithExpiry: <T>(key: string): T | null =>
      run(
        `Error leyendo de ${name} con expiración`,
        null,
        (storage) => {
          const item = storage.getItem(key);
          if (!item) return null;

          const parsed = JSON.parse(item) as { expiry?: number; value: T };
          if (parsed.expiry && Date.now() > parsed.expiry) {
            storage.removeItem(key);
            return null;
          }

          return parsed.value;
        },
        key,
      ),
  };
};

const localStorageApi = createStorage("localStorage", () => localStorage);
const sessionStorageApi = createStorage("sessionStorage", () => sessionStorage);

export const setLocalStorage = localStorageApi.set;
export const getLocalStorage = localStorageApi.get;
export const removeLocalStorage = localStorageApi.remove;
export const clearLocalStorage = localStorageApi.clear;
export const getLocalStorageKeys = localStorageApi.keys;
export const hasLocalStorage = localStorageApi.has;
export const setLocalStorageWithExpiry = localStorageApi.setWithExpiry;
export const getLocalStorageWithExpiry = localStorageApi.getWithExpiry;

export const setSessionStorage = sessionStorageApi.set;
export const getSessionStorage = sessionStorageApi.get;
export const removeSessionStorage = sessionStorageApi.remove;
export const clearSessionStorage = sessionStorageApi.clear;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  AUTH_USER: "auth_user",
  AUTH_REFRESH_TOKEN: "auth_refresh_token",
  THEME: "theme",
  SIDEBAR_STATE: "sidebar_state",
  LANGUAGE: "language",
  CLIENTS: "clients_cache",
  ROOMS: "rooms_cache",
  RESERVATIONS: "reservations_cache",
  USER_PREFERENCES: "user_preferences",
  RECENT_SEARCHES: "recent_searches",
  REDIRECT_URL: "redirect_url",
  FORM_DRAFT: "form_draft",
} as const;

export const saveAuthToken = (token: string): void => {
  setLocalStorage(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getAuthToken = (): string | null =>
  getLocalStorage<string>(STORAGE_KEYS.AUTH_TOKEN);

export const saveAuthUser = (user: User): void => {
  setLocalStorage(STORAGE_KEYS.AUTH_USER, user);
};

export const getAuthUser = (): User | null =>
  getLocalStorage<User>(STORAGE_KEYS.AUTH_USER);

export const clearAuthStorage = (): void => {
  removeLocalStorage(STORAGE_KEYS.AUTH_TOKEN);
  removeLocalStorage(STORAGE_KEYS.AUTH_USER);
  removeLocalStorage(STORAGE_KEYS.AUTH_REFRESH_TOKEN);
};

export const saveTheme = (theme: "light" | "dark"): void => {
  setLocalStorage(STORAGE_KEYS.THEME, theme);
};

export const getTheme = (): "light" | "dark" | null =>
  getLocalStorage<"light" | "dark">(STORAGE_KEYS.THEME);

export const saveRedirectUrl = (url: string): void => {
  setSessionStorage(STORAGE_KEYS.REDIRECT_URL, url);
};

export const getAndClearRedirectUrl = (): string | null => {
  const url = getSessionStorage<string>(STORAGE_KEYS.REDIRECT_URL);
  removeSessionStorage(STORAGE_KEYS.REDIRECT_URL);
  return url;
};

export const savFormDraft = (formName: string, data: unknown): void => {
  const key = `${STORAGE_KEYS.FORM_DRAFT}_${formName}`;
  setLocalStorageWithExpiry(key, data, 24 * 60 * 60 * 1000);
};

export const getFormDraft = (formName: string): unknown | null => {
  const key = `${STORAGE_KEYS.FORM_DRAFT}_${formName}`;
  return getLocalStorageWithExpiry(key);
};

export const clearFormDraft = (formName: string): void => {
  const key = `${STORAGE_KEYS.FORM_DRAFT}_${formName}`;
  removeLocalStorage(key);
};
