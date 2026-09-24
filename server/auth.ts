import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getDb, queryRow } from './db.js';

const JWT_SECRET = process.env.SESSION_SECRET || 'court-dairy-judicial-offline-secret-key-2026';
// In-memory token store mapped to sessions
const activeSessions = new Map<string, { userId: number; username: string; fullName: string; role: string; expiresAt: number }>();

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(testHash, 'hex'));
  } catch (e) {
    return false;
  }
}

export function createSessionToken(user: { UserID: number; Username: string; FullName: string; Role: string }): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
  activeSessions.set(token, {
    userId: user.UserID,
    username: user.Username,
    fullName: user.FullName,
    role: user.Role,
    expiresAt
  });
  return token;
}

export function revokeSessionToken(token: string): void {
  activeSessions.delete(token);
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    fullName: string;
    role: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.substring(7).trim();
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  req.user = {
    userId: session.userId,
    username: session.username,
    fullName: session.fullName,
    role: session.role
  };

  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'Administrator') {
    return res.status(403).json({ error: 'Access denied. Administrator privilege required.' });
  }
  next();
}
