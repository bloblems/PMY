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

  // Configure PostgreSQL session store for production-ready persistent sessions
  const PgSession = connectPgSimple(session);
  
  // Session configuration with PostgreSQL backing
  app.use(
    session({
      store: new PgSession({
        pool: pool, // Use existing PostgreSQL connection pool
        tableName: 'session', // Will be created automatically
        createTableIfMissing: true,
        // Prune expired sessions automatically
        pruneSessionInterval: 60 * 15, // Run every 15 minutes
      }),
      secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      rolling: true, // Reset expiration on activity
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: "strict", // CSRF protection: prevent cross-site cookie transmission
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

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

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
}
