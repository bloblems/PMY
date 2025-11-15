// Replit OIDC Authentication Module
// Based on javascript_log_in_with_replit integration
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { pool } from "./db";
import { logAuthEvent } from "./securityLogger";

// Memoize OIDC configuration for 1 hour
const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

// Create session middleware for OIDC
export function getOidcSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    pool: pool,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "strict",
    },
  });
}

// Update user session with OIDC tokens
function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

// Upsert user in database from OIDC claims
async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"] || null,
    firstName: claims["first_name"] || null,
    lastName: claims["last_name"] || null,
    profileImageUrl: claims["profile_image_url"] || null,
  });
}

// Setup Replit OIDC authentication
export async function setupOidcAuth(app: Express) {
  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies per domain
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  // OIDC login route
  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // OIDC callback route
  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/auth/login",
    })(req, res, (err: any) => {
      if (err) {
        logAuthEvent(req, "login_failure", undefined, undefined, { error: err.message, method: "oidc" });
        return next(err);
      }
      
      // Log successful OIDC login
      const userId = (req.user as any)?.claims?.sub;
      const email = (req.user as any)?.claims?.email;
      logAuthEvent(req, "login", userId, email, { method: "oidc" });
      
      res.redirect("/");
    });
  });

  // OIDC logout route
  app.get("/api/logout", (req, res) => {
    const userId = (req.user as any)?.claims?.sub;
    const email = (req.user as any)?.claims?.email;
    
    req.logout(() => {
      logAuthEvent(req, "logout", userId, email);
      
      res.redirect(
        client.buildEndSessionUrl(getOidcConfig() as any, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

// Middleware for OIDC token refresh
export const isOidcAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Token expired, try to refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
