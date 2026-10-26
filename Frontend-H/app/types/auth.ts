/**
 * Tipos de autenticación
 */

import type { SessionUser, SessionData, SessionLoginInput, MfaChallengeResponse, MfaEnrollmentResponse } from './generated/api';
export type User = SessionUser;
export type UserRole = User['role'];

export type LoginRequest = SessionLoginInput;

export type LoginResponse = SessionData;

export type MfaChallenge = MfaChallengeResponse['data'];
export type MfaEnrollment = MfaEnrollmentResponse['data'];

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: UserRole;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  csrfToken: string | null;
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
