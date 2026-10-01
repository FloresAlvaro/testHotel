// Re-exportar todos los tipos
export * from "./auth";
export * from "./client";
export * from "./room";
export * from "./reservation";
export * from "./payment";
export * from "./api";

// Tipos globales
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export type SortOrder = "ASC" | "DESC";

export interface SortOptions {
  field: string;
  order: SortOrder;
}

export interface FilterOptions {
  [key: string]: unknown;
}

export interface RequestOptions {
  page?: number;
  pageSize?: number;
  sort?: SortOptions;
  filters?: FilterOptions;
}
