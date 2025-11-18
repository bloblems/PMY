import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from './supabase';

// Supabase user type for requests
export interface SupabaseUser {
  id: string;
  email?: string;
  [key: string]: any;
}

// Extend Express Request type to include Supabase user
declare global {
  namespace Express {
    interface Request {
      user?: SupabaseUser;
    }
  }
}

/**
 * Middleware to verify Supabase JWT token and attach user to request
 * Expects Authorization header with Bearer token
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token using Supabase Admin client
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error('[Auth] Token verification failed:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      ...user.user_metadata,
    };

    next();
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional auth middleware - attaches user if token is present, but doesn't require it
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
          ...user.user_metadata,
        };
      }
    }

    next();
  } catch (error) {
    // Silent fail for optional auth
    next();
  }
}
