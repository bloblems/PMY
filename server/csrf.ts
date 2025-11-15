import { randomBytes } from "crypto";
import { type Request, type Response, type NextFunction } from "express";
import { logCsrfFailure } from "./securityLogger";

// Extend Express session type to include csrfToken
declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
  }
}

// CSRF Protection using Double Submit Cookie Pattern
// This is iOS/Capacitor compatible and works in both web and mobile WebView

/**
 * Generates a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Middleware to set CSRF token in cookie and make it available to the frontend
 * This should be called on routes that need CSRF protection
 */
export function setCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Only generate new token if one doesn't exist
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCsrfToken();
  }

  // Set CSRF token in a separate cookie for double-submit pattern
  // This cookie is readable by JavaScript (not httpOnly) so frontend can access it
  res.cookie("XSRF-TOKEN", req.session.csrfToken, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: false, // Must be readable by JavaScript for double-submit pattern
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days, matches session cookie
  });

  next();
}

/**
 * Middleware to validate CSRF token on state-changing requests (POST, PUT, DELETE, PATCH)
 * Uses double-submit cookie pattern: compares token in cookie with token in request header
 */
export function validateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF validation for GET, HEAD, OPTIONS (read-only methods)
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Get CSRF token from request header (set by frontend)
  const headerToken = req.headers["x-csrf-token"] as string;
  
  // Get CSRF token from session (server-side storage)
  const sessionToken = req.session.csrfToken;

  // Validate token presence and matching
  if (!headerToken || !sessionToken || headerToken !== sessionToken) {
    // Log CSRF validation failure for security monitoring
    const user = req.user as any;
    logCsrfFailure(req, user?.id);
    
    return res.status(403).json({ 
      error: "Invalid CSRF token",
      code: "CSRF_VALIDATION_FAILED"
    });
  }

  next();
}

/**
 * Combined middleware that both sets and validates CSRF tokens
 * Use this on authenticated routes that need CSRF protection
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  setCsrfToken(req, res, () => {
    validateCsrfToken(req, res, next);
  });
}
