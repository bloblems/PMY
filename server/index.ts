import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDataRetention } from "./dataRetention";

const app = express();

// Trust proxy for production deployments
app.set("trust proxy", 1);

// Configure CORS with environment-driven origin whitelist
// In production, set ALLOWED_ORIGINS="https://pmy.replit.app,https://your-custom-domain.com"
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  const baseOrigins = ["http://localhost:5000", "http://127.0.0.1:5000"];
  
  if (envOrigins) {
    const productionOrigins = envOrigins.split(",").map(o => o.trim());
    return [...baseOrigins, ...productionOrigins];
  }
  
  return baseOrigins;
};

const allowedOrigins = getAllowedOrigins();

// Log allowed origins on startup
log(`CORS allowed origins: ${allowedOrigins.join(", ")}`);

// Pre-CORS middleware: Explicitly reject disallowed origins before they reach routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Allow requests with no origin (mobile apps, Postman, curl)
  if (!origin) {
    return next();
  }
  
  // Development: Allow all localhost and Replit preview origins
  if (process.env.NODE_ENV === "development") {
    if (
      origin.startsWith("http://localhost:") || 
      origin.startsWith("http://127.0.0.1:") ||
      origin.includes(".replit.dev")
    ) {
      log(`CORS: Allowed dev origin: ${origin}`);
      return next();
    }
  }
  
  // Production: Only allow whitelisted origins
  if (allowedOrigins.includes(origin)) {
    log(`CORS: Allowed origin: ${origin}`);
    return next();
  }
  
  // Reject disallowed origin with 403
  log(`CORS: Rejected origin: ${origin} attempting to access ${req.method} ${req.path}`);
  return res.status(403).json({
    error: "CORS policy violation",
    message: "Origin not allowed",
  });
});

// Standard CORS middleware (only for allowed origins)
app.use(
  cors({
    origin: true, // Trust the pre-CORS middleware above for origin validation
    credentials: true, // Allow cookies and authorization headers
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Initialize automatic data retention cleanup
    initializeDataRetention();
  });
})();
