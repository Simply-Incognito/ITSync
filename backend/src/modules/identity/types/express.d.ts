import type { AuthenticatedIdentity } from '../services/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      identity?: AuthenticatedIdentity;
    }
  }
}

export {};
