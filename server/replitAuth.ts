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

// Store OIDC tokens in session (separate from Passport user object)
function storeTokensInSession(
  req: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  const claims = tokens.claims();
  req.session.oidc_tokens = {
    claims,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: claims?.exp,
  };
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
    console.log("[OIDC] verify function called");
    const claims = tokens.claims();
    console.log("[OIDC] Claims:", claims ? "present" : "null");
    
    // Upsert user in database
    await upsertUser(claims);
    console.log("[OIDC] User upserted");
    
    // Retrieve the database user record
    const dbUser = await storage.getUser(claims["sub"]);
    if (!dbUser) {
      console.error("[OIDC] Failed to retrieve user from database");
      return verified(new Error("Failed to retrieve user from database"));
    }
    
    console.log("[OIDC] Database user retrieved:", dbUser.id);
    
    // Store token metadata for later retrieval (attached to user for the callback handler)
    const user = {
      ...dbUser,
      _oidc_tokens: {
        claims,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: claims?.exp,
      }
    };
    
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
    console.log("[OIDC] /api/login called");
    ensureStrategy(req.hostname);
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // OIDC callback route
  app.get("/api/callback", (req, res, next) => {
    console.log("[OIDC] /api/callback called, query:", req.query);
    ensureStrategy(req.hostname);
    
    passport.authenticate(`replitauth:${req.hostname}`, (err: any, user: any) => {
      console.log("[OIDC] Passport authenticate callback - err:", err, "user:", user ? "exists" : "null");
      
      if (err) {
        console.error("[OIDC] Authentication error:", err);
        logAuthEvent(req, "login_failure", undefined, undefined, { error: err.message, method: "oidc" });
        return res.redirect("/auth/login");
      }
      
      if (!user) {
        console.error("[OIDC] No user returned from passport");
        logAuthEvent(req, "login_failure", undefined, undefined, { error: "No user returned", method: "oidc" });
        return res.redirect("/auth/login");
      }
      
      // Extract OIDC tokens from user object
      const oidcTokens = (user as any)._oidc_tokens;
      console.log("[OIDC] OIDC tokens present:", !!oidcTokens);
      
      // Store tokens in session (separate from Passport user)
      if (oidcTokens) {
        req.session.oidc_tokens = oidcTokens;
      }
      
      // Log the user in (this will serialize only user.id via Passport)
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("[OIDC] req.login error:", loginErr);
          logAuthEvent(req, "login_failure", user.id, user.email, { error: loginErr.message, method: "oidc" });
          return next(loginErr);
        }
        
        console.log("[OIDC] Login successful for user:", user.id);
        
        // Log successful OIDC login
        logAuthEvent(req, "login", user.id, user.email, { method: "oidc" });
        
        res.redirect("/");
      });
    })(req, res, next);
  });

  // OIDC logout route
  app.get("/api/logout", async (req, res) => {
    const user = req.user as any;
    const userId = user?.id;
    const email = user?.email;
    
    // Log before logout (user will be cleared after)
    logAuthEvent(req, "logout", userId, email, { method: "oidc" });
    
    req.logout((err) => {
      // Clear OIDC tokens from session
      if (req.session?.oidc_tokens) {
        delete req.session.oidc_tokens;
      }
      
      if (err) {
        console.error("Logout error:", err);
        return res.redirect("/");
      }
      
      // Build end session URL with awaited config
      getOidcConfig().then((config) => {
        const endSessionUrl = client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        });
        res.redirect(endSessionUrl.href);
      }).catch((configErr) => {
        console.error("Failed to get OIDC config for logout:", configErr);
        res.redirect("/");
      });
    });
  });
}

// Middleware for OIDC token refresh
export const isOidcAuthenticated: RequestHandler = async (req, res, next) => {
  const oidcTokens = req.session?.oidc_tokens;

  // Check if authenticated and has OIDC tokens
  if (!req.isAuthenticated() || !oidcTokens) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // If no expires_at or not expired, proceed
  if (!oidcTokens.expires_at) {
    return next();
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= oidcTokens.expires_at) {
    return next();
  }

  // Token expired, try to refresh
  const refreshToken = oidcTokens.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    
    // Update tokens in session
    storeTokensInSession(req, tokenResponse);
    
    // Refresh user claims if email/name changed
    const newClaims = tokenResponse.claims();
    if (newClaims) {
      await upsertUser(newClaims);
      
      // Reload user from database
      const updatedUser = await storage.getUser(newClaims["sub"]);
      if (updatedUser) {
        // Update session via req.login to persist changes across requests
        return new Promise<void>((resolve, reject) => {
          req.login(updatedUser, (err) => {
            if (err) {
              console.error("Failed to update session after refresh:", err);
              reject(err);
            } else {
              resolve();
            }
          });
        }).then(() => next()).catch(() => {
          res.status(500).json({ message: "Failed to update session" });
        });
      }
    }
    
    return next();
  } catch (error) {
    console.error("Token refresh failed:", error);
    
    // Clear stale tokens and force logout on refresh failure
    if (req.session?.oidc_tokens) {
      delete req.session.oidc_tokens;
    }
    
    req.logout(() => {
      res.status(401).json({ message: "Unauthorized" });
    });
    return;
  }
};
