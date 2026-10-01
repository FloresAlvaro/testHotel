/**
 * Tipos de clientes (huéspedes)
 */

export type DocumentType = "cedula" | "passport" | "license" | "other";
export type Gender = "M" | "F";

export interface Client {
  id: number;
  name: string;
  document: string;
  document_type: DocumentType;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientRequest {
  name: string;
  document: string;
  document_type: DocumentType;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: Gender;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: Gender;
  emergency_contact?: string;
  emergency_phone?: string;
  notes?: string;
}

export interface ClientStats {
  total_reservations: string;
  completed_stays: string;
  total_spent: string | null;
  avg_spend: string | null;
}

export interface ClientWithStats extends Client {
  stats?: ClientStats;
}

export interface ClientState {
  clients: Client[];
  currentClient: Client | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
