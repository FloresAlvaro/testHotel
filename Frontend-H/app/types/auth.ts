import type { components } from './generated/api';
/**
 * Tipos de autenticación
 */

export type UserRole = components['schemas']['UserRole'];

export type User = components['schemas']['User'];

export type LoginRequest = components['schemas']['LoginRequest'];

export type LoginResponse = components['schemas']['LoginResponse'];

export type RegisterRequest = components['schemas']['RegisterRequest'];

export type ChangePasswordRequest = components['schemas']['ChangePasswordRequest'];

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface JWTPayload {
  id: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
export type InviteRequest = components['schemas']['InviteRequest'];
export type Invitation = components['schemas']['Invitation'];
export type AccountSession = components['schemas']['Session'];
