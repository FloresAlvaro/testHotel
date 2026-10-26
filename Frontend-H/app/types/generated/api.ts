// Generado con Backend-H: npm run api:generate. No editar.
export type SessionUser = {
  "id": number;
  "name": string;
  "email": string;
  "role": "admin" | "manager" | "receptionist" | "customer";
  "client_id"?: (number) | null;
  "is_active": boolean;
  "created_at": string;
  "updated_at": string;
  "auth_version"?: number;
  "client_active"?: (boolean) | null;
};

export type SessionLoginInput = {
  "email": string;
  "password": string;
};

export type SessionData = {
  "user": SessionUser;
  "csrfToken": string;
};

export type SessionResponse = {
  "success": true;
  "data": SessionData;
  "message"?: string;
  "timestamp"?: string;
};

export type StaffInvitationInput = {
  "name": string;
  "email": string;
  "role": "admin" | "manager" | "receptionist";
};

export type CustomerInvitationInput = {
  "name": string;
  "email": string;
  "role": "customer";
  "client_id": number;
};

export type InvitationInput = StaffInvitationInput | CustomerInvitationInput;

export type AcceptInvitationInput = {
  "token": string;
  "password": string;
};

export type Invitation = {
  "id": string;
  "name": string;
  "email": string;
  "role": "admin" | "manager" | "receptionist" | "customer";
  "client_id"?: (number) | null;
  "created_at"?: string;
  "expires_at": string;
  "used_at"?: (string) | null;
};

export type InvitationResponse = {
  "success": true;
  "data": Invitation;
  "message"?: string;
};

export type BackupStatus = {
  "latest": ({
  "verified_at": string;
  "archive": string;
  "restored": boolean;
  "offsite_verified"?: boolean;
}) | null;
  "status": ({
  "ok": boolean;
  "attempted_at": string;
}) | null;
  "storage": string;
  "offsite_configured": boolean;
};

export type PaymentListSummary = {
  "total": number;
  "completed_count": number;
  "pending_count": number;
  "refunded_count": number;
  "income": string;
  "pending": string;
  "refunds": string;
  "max_income": string;
};

export type OwnSession = {
  "id": string;
  "created_at": string;
  "expires_at": string;
  "current": boolean;
};

export type OwnSessionsResponse = {
  "success": boolean;
  "data": Array<OwnSession>;
};

export type MfaChallengeResponse = {
  "success": boolean;
  "data": {
  "mfaRequired": boolean;
  "challengeId": string;
  "enrollmentRequired": boolean;
};
};

export type MfaEnrollmentResponse = {
  "success": boolean;
  "data": {
  "secret": string;
  "uri": string;
  "recoveryCodes": Array<string>;
};
};

export type MfaStatusResponse = {
  "success": boolean;
  "data": {
  "enabled": boolean;
  "required": boolean;
  "recoveryCodesRemaining": number;
};
};

export type MfaChallengeInput = {
  "challengeId": string;
};

export type MfaVerifyInput = {
  "challengeId": string;
  "code": string;
};

export type MfaConfirmInput = {
  "challengeId": string;
  "code": string;
  "recoveryCodesSaved": true;
};

export type MfaRenewInput = {
  "password": string;
  "code": string;
};

export type BearerLoginResponse = {
  "success": boolean;
  "data": {
  "user": SessionUser;
  "token": string;
};
};

export type MfaCompletionResponse = SessionResponse | BearerLoginResponse;

export type MfaEnableInput = {
  "password": string;
};
