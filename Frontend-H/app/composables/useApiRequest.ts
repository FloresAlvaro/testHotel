import { useApiClient } from "../services/api";

type ApiRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ApiRequestBody = BodyInit | Record<string, unknown> | null;

type ApiRequestOptions<T> = {
  method?: ApiRequestMethod;
  body?: ApiRequestBody;
  headers?: Record<string, string>;
  transform?: (data: unknown) => T;
};

type ApiRequestResult<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export const useApiRequest = () => {
  const api = useApiClient();
  const loading = ref(false);
  const error = ref<string | null>(null);
  const data = ref<unknown>(null);

  const request = async <T = unknown>(
    url: string,
    options?: ApiRequestOptions<T>,
  ): Promise<ApiRequestResult<T>> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.request<unknown>(url, {
        method: options?.method ?? "GET",
        body: options?.body,
        headers: options?.headers,
      });
      const result = options?.transform
        ? options.transform(response)
        : (response as T);

      data.value = result;
      return { success: true, data: result, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      error.value = message;
      return { success: false, data: null, error: message };
    } finally {
      loading.value = false;
    }
  };

  const get = <T = unknown>(
    url: string,
    options?: Omit<ApiRequestOptions<T>, "method" | "body">,
  ) => request<T>(url, { ...options, method: "GET" });

  const post = <T = unknown>(
    url: string,
    body: ApiRequestBody,
    options?: Omit<ApiRequestOptions<T>, "method" | "body">,
  ) => request<T>(url, { ...options, method: "POST", body });

  const put = <T = unknown>(
    url: string,
    body: ApiRequestBody,
    options?: Omit<ApiRequestOptions<T>, "method" | "body">,
  ) => request<T>(url, { ...options, method: "PUT", body });

  const patch = <T = unknown>(
    url: string,
    body: ApiRequestBody,
    options?: Omit<ApiRequestOptions<T>, "method" | "body">,
  ) => request<T>(url, { ...options, method: "PATCH", body });

  const del = <T = unknown>(
    url: string,
    options?: Omit<ApiRequestOptions<T>, "method" | "body">,
  ) => request<T>(url, { ...options, method: "DELETE" });

  const retryFetch = async <T = unknown>(
    url: string,
    options?: ApiRequestOptions<T>,
    maxRetries = 3,
    delayMs = 1000,
  ): Promise<ApiRequestResult<T>> => {
    let result: ApiRequestResult<T> = {
      success: false,
      data: null,
      error: "Max retries alcanzado",
    };

    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      result = await request<T>(url, options);
      if (result.success) return result;

      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * (attempt + 1)),
        );
      }
    }

    return result;
  };

  const reset = () => {
    loading.value = false;
    error.value = null;
    data.value = null;
  };

  return {
    loading: readonly(loading),
    error: readonly(error),
    data: readonly(data),
    request,
    get,
    post,
    put,
    delete: del,
    patch,
    reset,
    retryFetch,
  };
};
