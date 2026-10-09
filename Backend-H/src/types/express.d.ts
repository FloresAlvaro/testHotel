import type { components } from './api';
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: Pick<components['schemas']['User'], 'id' | 'email' | 'role' | 'is_active'> & {
        sid: string;
      };
    }
  }
}
export {};
