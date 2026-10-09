import type { components } from './generated/api';
/**
 * Tipos de clientes (huéspedes)
 */

export type DocumentType = components['schemas']['DocumentType'];
export type Gender = components['schemas']['Gender'];

export type Client = components['schemas']['Client'];

export type CreateClientRequest = components['schemas']['CreateClientRequest'];

export type UpdateClientRequest = components['schemas']['UpdateClientRequest'];

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
