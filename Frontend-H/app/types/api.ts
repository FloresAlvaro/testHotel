import type { components } from './generated/api';
/**
 * Tipos de respuestas de la API
 */

import type { User } from "./auth";
import type { Client } from "./client";
import type { Payment } from "./payment";
import type { Reservation } from "./reservation";
import type { Room } from "./room";

export type ApiPagination = components['schemas']['ApiPagination'];

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string> | string[];
  pagination?: ApiPagination;
  timestamp?: string;
  requestId?: string;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode?: number;
  errors?: Record<string, string>;
}

export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: ApiPagination;
}

export type LoginApiResponse = ApiResponse<{
  user: User;
  token: string;
  tokenType?: string;
}>;

export type ClientsApiResponse = PaginatedApiResponse<Client>;
export type RoomsApiResponse = PaginatedApiResponse<Room>;
export type ReservationsApiResponse = PaginatedApiResponse<Reservation>;
export type PaymentsApiResponse = PaginatedApiResponse<Payment>;

export interface ListOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface ListResponse<T> {
  data: T[];
  pagination: ApiPagination;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface CrudLoadingState extends LoadingState {
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}
