import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { randomBytes, pbkdf2Sync } from "crypto";
import { pool } from "./db";
import { logAuthEvent } from "./securityLogger";

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const newSalt = salt || randomBytes(32).toString("hex");
  const hash = pbkdf2Sync(password, newSalt, 10000, 64, "sha512").toString("hex");
  return { hash, salt: newSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

export function setupAuth(app: Express) {
  // Require SESSION_SECRET in production
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required in production");
  }

  // Note: Session middleware is now set up in index.ts (shared with OIDC)
  // Passport initialization is also done in index.ts to be shared
  
  // Email/password auth strategies setup only

  // Local strategy for signup
  passport.use(
    "local-signup",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        try {
          // Check if user already exists
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser) {
            logAuthEvent(req, "signup_failure", undefined, email, { reason: "Email already exists" });
            return done(null, false, { message: "Email already exists" });
          }

          // Create user with hashed password
          const { hash, salt } = hashPassword(password);

          const user = await storage.createUser({
            id: randomBytes(16).toString("hex"),
            email,
            name: req.body.name || email.split("@")[0],
            profilePictureUrl: null,
            passwordHash: hash,
            passwordSalt: salt,
          });

          logAuthEvent(req, "signup", user.id, email);
          return done(null, user);
        } catch (error) {
          logAuthEvent(req, "signup_failure", undefined, email, { error: (error as Error).message });
          return done(error);
        }
      }
    )
  );

  // Local strategy for login
  passport.use(
    "local-login",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            logAuthEvent(req, "login_failure", undefined, email, { reason: "User not found" });
            return done(null, false, { message: "Invalid credentials" });
          }

          // Check if user has password (email/password user) or OIDC user
          if (!user.passwordHash || !user.passwordSalt) {
            logAuthEvent(req, "login_failure", user.id, email, { reason: "User created via OIDC, use 'Log in with Replit' instead" });
            return done(null, false, { message: "Please use 'Log in with Replit' for this account" });
          }

          // Verify password against stored hash
          if (!verifyPassword(password, user.passwordHash, user.passwordSalt)) {
            logAuthEvent(req, "login_failure", user.id, email, { reason: "Invalid password" });
            return done(null, false, { message: "Invalid credentials" });
          }

          // Update last login
          await storage.updateUserLastLogin(user.id);

          logAuthEvent(req, "login", user.id, email);
          return done(null, user);
        } catch (error) {
          logAuthEvent(req, "login_failure", undefined, email, { error: (error as Error).message });
          return done(error);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}

// Unified middleware to check if user is authenticated (supports both email/password and OIDC)
export function isAuthenticated(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Check if this is an OIDC user (has claims/expires_at)
  const user = req.user as any;
  if (user?.claims && user?.expires_at) {
    // OIDC user - check if token is expired (refresh is handled by separate middleware)
    const now = Math.floor(Date.now() / 1000);
    if (now > user.expires_at && !user.refresh_token) {
      return res.status(401).json({ error: "Token expired" });
    }
  }

  // User is authenticated (either email/password or valid OIDC)
  return next();
}
