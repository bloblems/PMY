import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConsentRecordingSchema, insertConsentContractSchema, insertUniversityReportSchema, insertVerificationPaymentSchema } from "@shared/schema";
import multer from "multer";
import OpenAI from "openai";
import Stripe from "stripe";
import passport from "passport";
import { generateChallenge, verifyAttestation, generateSessionId } from "./webauthn";
import { isAuthenticated, hashResetToken, verifyResetToken } from "./auth";
import { sendInvitationEmail, sendDocumentEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetConfirmationEmail } from "./email";
import rateLimit from "express-rate-limit";
import { csrfProtection, setCsrfToken } from "./csrf";
import { validateFileUpload } from "./fileValidation";
import { logAuthEvent, logConsentEvent, logRateLimitViolation } from "./securityLogger";

const upload = multer({ storage: multer.memoryStorage() });

// Rate limiting configuration for sharing endpoints
// Prevents abuse of email-sending functionality
const referralRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // Limit each user to 10 referral invitations per hour
  message: "Too many invitation emails sent. Please try again later.",
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  // Use user ID from session - these endpoints require authentication
  keyGenerator: (req) => {
    const user = req.user as any;
    return user?.id || 'unauthenticated';
  },
  skipFailedRequests: true, // Don't count failed requests (auth errors, etc.)
  handler: (req, res) => {
    const user = req.user as any;
    logRateLimitViolation(
      req,
      "referral_invitation",
      user?.id
    );
    res.status(429).json({
      error: "Too many invitation emails sent. Please try again in an hour.",
    });
  },
});

const documentShareRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // Limit each user to 20 document shares per hour
  message: "Too many documents shared. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID from session - these endpoints require authentication
  keyGenerator: (req) => {
    const user = req.user as any;
    return user?.id || 'unauthenticated';
  },
  skipFailedRequests: true, // Don't count failed requests (auth errors, etc.)
  handler: (req, res) => {
    const user = req.user as any;
    logRateLimitViolation(
      req,
      "document_share",
      user?.id
    );
    res.status(429).json({
      error: "Too many documents shared. Please try again in an hour.",
    });
  },
});

// Helper function to validate Base64 signature size
// Base64 encoding increases size by ~33%, so we decode to get true byte size
function validateSignatureSize(dataURL: string, maxBytes: number = 2 * 1024 * 1024): { valid: boolean; error?: string } {
  if (!dataURL) return { valid: true };
  
  try {
    // Remove data URL prefix (e.g., "data:image/png;base64,")
    const base64Data = dataURL.split(',')[1] || dataURL;
    
    // Calculate decoded byte size: (Base64 length * 3) / 4, minus padding
    // Count padding characters (= at the end)
    const padding = (base64Data.match(/=/g) || []).length;
    const decodedSize = Math.floor((base64Data.length * 3) / 4) - padding;
    
    if (decodedSize > maxBytes) {
      const sizeMB = (decodedSize / (1024 * 1024)).toFixed(2);
      const maxMB = (maxBytes / (1024 * 1024)).toFixed(2);
      return { 
        valid: false, 
        error: `Size is too large (${sizeMB}MB exceeds ${maxMB}MB limit)` 
      };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid format" };
  }
}

const getStripeKey = () => {
  const testingKey = process.env.TESTING_STRIPE_SECRET_KEY;
  const prodKey = process.env.STRIPE_SECRET_KEY;
  
  if (process.env.NODE_ENV === 'test' || testingKey) {
    const key = testingKey || prodKey!;
    const keyPrefix = key.substring(0, 7);
    console.log(`[Stripe] Using testing secret key (prefix: ${keyPrefix}...)`);
    return key;
  }
  
  const keyPrefix = prodKey!.substring(0, 7);
  console.log(`[Stripe] Using production secret key (prefix: ${keyPrefix}...)`);
  return prodKey!;
};

const stripe = new Stripe(getStripeKey(), {
  apiVersion: "2025-10-29.clover",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/signup", (req, res, next) => {
    passport.authenticate("local-signup", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Signup error:", err);
        return res.status(500).json({ error: "Signup failed" });
      }
      if (!user) {
        console.error("Signup failed - no user:", info);
        return res.status(400).json({ error: info?.message || "Signup failed" });
      }
      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error("Login after signup error:", loginErr);
          return res.status(500).json({ error: "Login after signup failed" });
        }
        
        // Set CSRF token for the new session
        setCsrfToken(req, res, () => {});
        
        // Send welcome email (don't block response on email delivery)
        if (user.email && user.name) {
          sendWelcomeEmail({
            to: user.email,
            name: user.name
          }).catch(err => {
            console.error("Failed to send welcome email:", err);
          });
        }
        
        return res.json({ user: { id: user.id, email: user.email, name: user.name } });
      });
    })(req, res, next);
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local-login", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Login failed" });
        }
        
        // Set CSRF token for the new session
        setCsrfToken(req, res, () => {});
        
        return res.json({ user: { id: user.id, email: user.email, name: user.name } });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", csrfProtection, (req, res) => {
    const user = req.user as any;
    const email = user?.email;
    const userId = user?.id;
    
    // Log before logout
    logAuthEvent(req, "logout", userId, email, { method: "email" });
    
    req.logout((err) => {
      // Clear OIDC tokens if present (handles auth method switches)
      if (req.session?.oidc_tokens) {
        delete req.session.oidc_tokens;
      }
      
      if (err) {
        logAuthEvent(req, "logout_failure", userId, email, { error: err.message });
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = req.user as any;
    const oidcTokens = req.session?.oidc_tokens;
    
    // Check if OIDC by presence of tokens in session
    const authMethod = oidcTokens ? "oidc" : "email";
    
    // Construct name from firstName/lastName if available (OIDC users)
    const name = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || user.lastName || user.name || null;
    
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        profilePictureUrl: user.profilePictureUrl || null,
        savedSignature: user.savedSignature || null,
        savedSignatureType: user.savedSignatureType || null,
        savedSignatureText: user.savedSignatureText || null,
        authMethod,
      }
    });
  });

  // Password reset endpoints
  app.post("/api/auth/request-reset", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      // But only send email if user exists and uses email/password auth
      if (user && user.passwordHash) {
        // Generate secure reset token (32 random bytes = 64 hex characters)
        const resetToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        // Token expires in 1 hour
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);
        
        // Hash token before storing (security best practice)
        const hashedToken = hashResetToken(resetToken);
        
        // Save hashed token to database
        await storage.setPasswordResetToken(user.id, hashedToken, expiryDate);
        
        // Send reset email with unhashed token
        await sendPasswordResetEmail({
          to: user.email!,
          name: user.name || 'User',
          resetToken
        });
      }
      
      // Always return success to prevent email enumeration
      return res.json({ 
        success: true, 
        message: "If an account exists with that email, a password reset link has been sent." 
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      return res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      // Hash the provided token to search for it
      const hashedToken = hashResetToken(token);
      
      // Find user by hashed reset token
      const user = await storage.getUserByResetToken(hashedToken);
      
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Verify token matches stored hash (additional security check)
      if (!user.passwordResetToken || !verifyResetToken(token, user.passwordResetToken)) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (!user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
        return res.status(400).json({ error: "Reset token has expired" });
      }

      // Hash new password
      const crypto = await import('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(newPassword, salt, 100000, 64, 'sha512').toString('hex');

      // Update password and clear reset token
      await storage.updatePassword(user.id, hash, salt);
      await storage.clearPasswordResetToken(user.id);

      // Send confirmation email
      await sendPasswordResetConfirmationEmail({
        to: user.email!,
        name: user.name || 'User'
      });

      return res.json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      return res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Update user data retention policy
  app.patch("/api/auth/retention-policy", csrfProtection, isAuthenticated, async (req, res) => {
    try {
      const { dataRetentionPolicy } = req.body;
      const user = req.user as any;
      
      const validPolicies = ["30days", "90days", "1year", "forever"];
      if (!dataRetentionPolicy || !validPolicies.includes(dataRetentionPolicy)) {
        return res.status(400).json({ error: "Invalid retention policy" });
      }

      await storage.updateUserRetentionPolicy(user.id, dataRetentionPolicy);
      
      logAuthEvent(req, "retention_policy_updated", user.id, undefined, {
        newPolicy: dataRetentionPolicy
      });

      return res.json({ success: true, message: "Retention policy updated successfully" });
    } catch (error) {
      console.error("Update retention policy error:", error);
      return res.status(500).json({ error: "Failed to update retention policy" });
    }
  });

  // Change user email
  app.patch("/api/auth/change-email", csrfProtection, isAuthenticated, async (req, res) => {
    try {
      const { newEmail } = req.body;
      const user = req.user as any;
      
      if (!newEmail || typeof newEmail !== "string") {
        return res.status(400).json({ error: "Valid email is required" });
      }

      // Normalize email (trim and lowercase) for consistent comparison
      const normalizedEmail = newEmail.trim().toLowerCase();
      
      if (!normalizedEmail) {
        return res.status(400).json({ error: "Valid email is required" });
      }

      // Check if email is already in use (case-insensitive)
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ error: "Email already in use" });
      }

      await storage.updateUserEmail(user.id, normalizedEmail);
      
      logAuthEvent(req, "email_changed", user.id, normalizedEmail, {
        oldEmail: user.email
      });

      return res.json({ success: true, message: "Email updated successfully" });
    } catch (error) {
      console.error("Change email error:", error);
      return res.status(500).json({ error: "Failed to update email" });
    }
  });

  // Delete all user data (contracts, recordings)
  app.delete("/api/auth/delete-all-data", csrfProtection, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Delete all recordings and contracts for this user
      await storage.deleteAllUserData(user.id);
      
      logAuthEvent(req, "user_data_deleted", user.id, undefined, {
        action: "manual_deletion"
      });

      return res.json({ 
        success: true, 
        message: "All data has been permanently deleted" 
      });
    } catch (error) {
      console.error("Delete all data error:", error);
      return res.status(500).json({ error: "Failed to delete data" });
    }
  });

  // Delete entire user account
  app.delete("/api/auth/delete-account", csrfProtection, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user.id;
      const email = user.email;
      
      // Delete the user account and all associated data
      await storage.deleteUser(userId);
      
      logAuthEvent(req, "account_deleted", userId, email, {
        action: "user_initiated_deletion"
      });

      // Logout and destroy session
      req.logout((logoutErr) => {
        if (logoutErr) {
          console.error("Logout error after account deletion:", logoutErr);
        }
        
        // Destroy the session completely
        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            console.error("Session destruction error after account deletion:", sessionErr);
          }
          
          // Clear the session cookie
          res.clearCookie('connect.sid');
          return res.json({ success: true, message: "Account deleted successfully" });
        });
      });
    } catch (error) {
      console.error("Delete account error:", error);
      return res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // CSRF token endpoint - sets CSRF token in cookie and session
  app.get("/api/csrf-token", setCsrfToken, (req, res) => {
    // Token is already set in cookie by setCsrfToken middleware
    res.json({ success: true });
  });

  // WebAuthn endpoints for secure biometric authentication
  app.post("/api/webauthn/challenge", async (req, res) => {
    try {
      const { userName } = req.body;
      const origin = `${req.protocol}://${req.get('host')}`;
      
      if (!userName) {
        return res.status(400).json({ error: "userName is required" });
      }

      // Generate unique session ID
      const sessionId = generateSessionId();
      
      // Generate challenge options
      const options = await generateChallenge(sessionId, userName, origin);
      
      res.json({ sessionId, options });
    } catch (error) {
      console.error("Error generating WebAuthn challenge:", error);
      res.status(500).json({ error: "Failed to generate challenge" });
    }
  });

  app.post("/api/webauthn/verify", async (req, res) => {
    try {
      const { sessionId, attestationResponse } = req.body;
      const origin = `${req.protocol}://${req.get('host')}`;
      
      if (!sessionId || !attestationResponse) {
        return res.status(400).json({ error: "sessionId and attestationResponse are required" });
      }

      // Verify the attestation
      const verification = await verifyAttestation(sessionId, attestationResponse, origin);
      
      if (!verification.verified) {
        return res.status(400).json({ error: "Verification failed" });
      }

      // Extract credential data from registrationInfo.credential
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
      
      if (!credential) {
        return res.status(500).json({ error: "Missing credential data in verification result" });
      }
      
      res.json({
        verified: true,
        credentialId: Buffer.from(credential.id).toString('base64'),
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter,
        credentialDeviceType,
        credentialBackedUp,
      });
    } catch (error: any) {
      console.error("Error verifying WebAuthn attestation:", error);
      res.status(400).json({ error: error.message || "Verification failed" });
    }
  });

  // Get all universities
  app.get("/api/universities", async (_req, res) => {
    try {
      const universities = await storage.getAllUniversities();
      res.json(universities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch universities" });
    }
  });

  // Get a single university by ID
  app.get("/api/universities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const university = await storage.getUniversity(id);
      
      if (!university) {
        return res.status(404).json({ error: "University not found" });
      }

      res.json(university);
    } catch (error) {
      console.error("Error fetching university:", error);
      res.status(500).json({ error: "Failed to fetch university" });
    }
  });

  // Get user's recordings (requires authentication)
  app.get("/api/recordings", isAuthenticated, setCsrfToken, async (req, res) => {
    try {
      const user = req.user as any;
      const recordings = await storage.getRecordingsByUserId(user.id);
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recordings" });
    }
  });

  // Upload a new recording (requires authentication)
  app.post("/api/recordings", isAuthenticated, csrfProtection, upload.single("audio"), validateFileUpload("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const { filename, duration } = req.body;

      if (!filename || !duration) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // For now, store as data URL (will be replaced with object storage later)
      const fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      // SECURITY: Set userId from authenticated user to prevent Tea App-style data leaks
      const user = req.user as any;

      // Save to storage
      const recording = await storage.createRecording({
        userId: user.id,
        filename,
        fileUrl,
        duration,
      });

      res.json(recording);
    } catch (error) {
      console.error("Error uploading recording:", error);
      res.status(500).json({ error: "Failed to upload recording" });
    }
  });

  // Delete a recording (requires authentication)
  app.delete("/api/recordings/:id", isAuthenticated, csrfProtection, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const deleted = await storage.deleteRecording(id, user.id);
      if (!deleted) {
        return res.status(404).json({ error: "Recording not found or unauthorized" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recording" });
    }
  });

  // Get user's contracts (requires authentication)
  app.get("/api/contracts", isAuthenticated, setCsrfToken, async (req, res) => {
    try {
      const user = req.user as any;
      const contracts = await storage.getContractsByUserId(user.id);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  // Get a single contract (requires authentication and ownership)
  app.get("/api/contracts/:id", isAuthenticated, setCsrfToken, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const contract = await storage.getContract(id, user.id);
      
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  // Create a new contract (requires authentication)
  app.post("/api/contracts", isAuthenticated, csrfProtection, async (req, res) => {
    try {
      const { shouldSave, signatureType, signatureText, ...contractData } = req.body;
      const parsed = insertConsentContractSchema.safeParse(contractData);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid contract data" });
      }

      // Server-side validation: Require both signatures for contract validity
      if (!parsed.data.signature1 || !parsed.data.signature2) {
        return res.status(400).json({ 
          error: "Both signatures are required. Please ensure both parties have signed the contract." 
        });
      }

      // Validate signature sizes (max 2MB per signature to prevent database bloat)
      const sig1Validation = validateSignatureSize(parsed.data.signature1);
      if (!sig1Validation.valid) {
        return res.status(400).json({ error: `Signature 1: ${sig1Validation.error}` });
      }
      
      const sig2Validation = validateSignatureSize(parsed.data.signature2);
      if (!sig2Validation.valid) {
        return res.status(400).json({ error: `Signature 2: ${sig2Validation.error}` });
      }

      // SECURITY: Set userId from authenticated user to prevent Tea App-style data leaks
      const user = req.user as any;
      const contract = await storage.createContract({
        ...parsed.data,
        userId: user.id
      });
      
      // Save user's OWN signature (signature1) if requested
      // This ensures we never accidentally save the partner's signature
      if (shouldSave === true && parsed.data.signature1) {
        const user = req.user as any;
        
        await storage.updateUserSignature(
          user.id,
          parsed.data.signature1,
          signatureType || "draw",
          signatureText || null
        );
      }
      
      res.json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  // Delete a contract
  app.delete("/api/contracts/:id", isAuthenticated, csrfProtection, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user as any;
      const deleted = await storage.deleteContract(id, user.id);
      if (!deleted) {
        return res.status(404).json({ error: "Contract not found or unauthorized" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });

  // New consent creation endpoints with enhanced fields (requires authentication)
  app.post("/api/consent-contracts", isAuthenticated, csrfProtection, async (req, res) => {
    try {
      const parsed = insertConsentContractSchema.safeParse(req.body);
      
      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        return res.status(400).json({ error: "Invalid contract data", details: parsed.error });
      }

      // For signature-based contracts, require both signatures
      if (parsed.data.method === "signature") {
        if (!parsed.data.signature1 || !parsed.data.signature2) {
          return res.status(400).json({ 
            error: "Both signatures are required for signature-based contracts." 
          });
        }
      }

      // Validate ALL signature and photo fields to prevent oversized payloads
      if (parsed.data.signature1) {
        const sig1Validation = validateSignatureSize(parsed.data.signature1);
        if (!sig1Validation.valid) {
          return res.status(400).json({ error: `Signature 1: ${sig1Validation.error}` });
        }
      }
      if (parsed.data.signature2) {
        const sig2Validation = validateSignatureSize(parsed.data.signature2);
        if (!sig2Validation.valid) {
          return res.status(400).json({ error: `Signature 2: ${sig2Validation.error}` });
        }
      }
      if (parsed.data.photoUrl) {
        const photoValidation = validateSignatureSize(parsed.data.photoUrl, 5 * 1024 * 1024); // 5MB for photos
        if (!photoValidation.valid) {
          return res.status(400).json({ error: `Photo: ${photoValidation.error}` });
        }
      }

      // SECURITY: Set userId from authenticated user to prevent Tea App-style data leaks
      const user = req.user as any;
      const contract = await storage.createContract({
        ...parsed.data,
        userId: user.id
      });
      
      // Log consent creation
      logConsentEvent(
        req,
        "create_contract",
        "contract",
        contract.id,
        user.id,
        { method: parsed.data.method }
      );
      
      res.json(contract);
    } catch (error) {
      console.error("Error creating consent contract:", error);
      const user = req.user as any;
      logConsentEvent(
        req,
        "create_failure",
        "contract",
        undefined,
        user?.id,
        { method: req.body.method, error: (error as Error).message }
      );
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  app.post("/api/consent-recordings", isAuthenticated, csrfProtection, upload.single("audio"), validateFileUpload("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const { universityId, encounterType, parties, duration } = req.body;

      if (!duration) {
        return res.status(400).json({ error: "Missing required field: duration" });
      }

      // Parse parties JSON string
      const parsedParties = parties ? JSON.parse(parties) : [];

      // Store as data URL
      const fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const filename = `consent-${Date.now()}.webm`;

      // SECURITY: Set userId from authenticated user to prevent Tea App-style data leaks
      const user = req.user as any;

      // Save to storage with enhanced fields
      const recording = await storage.createRecording({
        userId: user.id,
        universityId: universityId || undefined,
        encounterType: encounterType || undefined,
        parties: parsedParties,
        filename,
        fileUrl,
        duration,
      });

      // Log consent creation
      logConsentEvent(
        req,
        "create_recording",
        "recording",
        recording.id,
        user.id,
        { duration, encounterType }
      );

      res.json(recording);
    } catch (error) {
      console.error("Error uploading consent recording:", error);
      const user = req.user as any;
      logConsentEvent(
        req,
        "create_failure",
        "recording",
        undefined,
        user?.id,
        { error: (error as Error).message }
      );
      res.status(500).json({ error: "Failed to upload recording" });
    }
  });

  app.post("/api/consent-photos", isAuthenticated, csrfProtection, upload.single("photo"), validateFileUpload("photo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No photo file provided" });
      }

      const { universityId, encounterType, parties } = req.body;

      // Parse parties JSON string
      const parsedParties = parties ? JSON.parse(parties) : [];

      // Store photo as data URL
      const photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

      // SECURITY: Set userId from authenticated user to prevent Tea App-style data leaks
      const user = req.user as any;

      // Create a contract with the photo
      const contract = await storage.createContract({
        userId: user.id,
        universityId: universityId || undefined,
        encounterType: encounterType || undefined,
        parties: parsedParties,
        method: "photo",
        contractText: `Photo consent uploaded on ${new Date().toLocaleDateString()} for ${encounterType || "encounter"}`,
        signature1: "Photo upload by party 1",
        signature2: "Mutual consent shown in photo",
        photoUrl,
      });

      // Log consent creation
      logConsentEvent(
        req,
        "create_photo",
        "contract",
        contract.id,
        user.id,
        { method: "photo", encounterType }
      );

      res.json(contract);
    } catch (error) {
      console.error("Error uploading consent photo:", error);
      const user = req.user as any;
      logConsentEvent(
        req,
        "create_failure",
        "contract",
        undefined,
        user?.id,
        { method: "photo", error: (error as Error).message }
      );
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  app.post("/api/consent-biometric", isAuthenticated, csrfProtection, async (req, res) => {
    try {
      const { 
        universityId, 
        encounterType, 
        parties, 
        credentialId, 
        credentialPublicKey,
        credentialCounter,
        credentialDeviceType,
        credentialBackedUp,
      } = req.body;

      // Validate required biometric fields
      if (!credentialId || !credentialPublicKey || !credentialCounter) {
        return res.status(400).json({ 
          error: "Missing required biometric fields: credentialId, credentialPublicKey, credentialCounter" 
        });
      }

      // Parse parties if it's a string
      const parsedParties = typeof parties === 'string' ? JSON.parse(parties) : parties;
      
      const now = new Date();

      // Validate the full contract data using schema
      const contractData = {
        universityId: universityId || undefined,
        encounterType: encounterType || undefined,
        parties: parsedParties,
        method: "biometric",
        contractText: `Biometric consent authenticated on ${now.toLocaleDateString()} using Touch ID/Face ID for ${encounterType || "encounter"}. Cryptographically verified using WebAuthn.`,
        credentialId,
        credentialPublicKey,
        credentialCounter,
        credentialDeviceType,
        credentialBackedUp,
        authenticatedAt: now.toISOString(),
        verifiedAt: now.toISOString(),
      };

      const parsed = insertConsentContractSchema.safeParse(contractData);
      
      if (!parsed.success) {
        console.error("Biometric contract validation error:", parsed.error);
        return res.status(400).json({ 
          error: "Invalid biometric contract data", 
          details: parsed.error 
        });
      }

      // SECURITY: Set userId from authenticated user to prevent Tea App-style data leaks
      const user = req.user as any;

      // Create contract with verified biometric data
      const contract = await storage.createContract({
        ...parsed.data,
        userId: user.id
      });

      // Log consent creation
      logConsentEvent(
        req,
        "create_biometric",
        "contract",
        contract.id,
        user.id,
        { method: "biometric", encounterType: parsed.data.encounterType }
      );

      res.json(contract);
    } catch (error) {
      console.error("Error creating biometric consent:", error);
      const user = req.user as any;
      logConsentEvent(
        req,
        "create_failure",
        "contract",
        undefined,
        user?.id,
        { method: "biometric", error: (error as Error).message }
      );
      res.status(500).json({ error: "Failed to create biometric consent" });
    }
  });

  // Report outdated university information
  app.post("/api/reports", async (req, res) => {
    try {
      const parsed = insertUniversityReportSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid report data" });
      }

      const report = await storage.createReport(parsed.data);
      res.json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // Get all reports (admin)
  app.get("/api/admin/reports", async (_req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // Get pending reports (admin)
  app.get("/api/admin/reports/pending", async (_req, res) => {
    try {
      const reports = await storage.getPendingReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending reports" });
    }
  });

  // Update university Title IX information (admin)
  app.patch("/api/admin/universities/:id/title-ix", async (req, res) => {
    try {
      const { id } = req.params;
      const { titleIXInfo, titleIXUrl } = req.body;

      if (!titleIXInfo) {
        return res.status(400).json({ error: "titleIXInfo is required" });
      }

      const updated = await storage.updateUniversityTitleIX(id, titleIXInfo, titleIXUrl);
      
      if (!updated) {
        return res.status(404).json({ error: "University not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating university:", error);
      res.status(500).json({ error: "Failed to update university" });
    }
  });

  // Verify university information (admin)
  app.patch("/api/admin/universities/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      const verified = await storage.verifyUniversity(id);
      
      if (!verified) {
        return res.status(404).json({ error: "University not found" });
      }

      res.json(verified);
    } catch (error) {
      console.error("Error verifying university:", error);
      res.status(500).json({ error: "Failed to verify university" });
    }
  });

  // Resolve a report (admin)
  app.patch("/api/admin/reports/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;
      const resolved = await storage.resolveReport(id);
      
      if (!resolved) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json(resolved);
    } catch (error) {
      console.error("Error resolving report:", error);
      res.status(500).json({ error: "Failed to resolve report" });
    }
  });

  // Generate AI summary of Title IX policy
  app.post("/api/summarize-policy", async (req, res) => {
    try {
      const { titleIXInfo } = req.body;

      if (!titleIXInfo || typeof titleIXInfo !== 'string') {
        return res.status(400).json({ error: "Missing or invalid titleIXInfo" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes Title IX consent policies for college students. Create concise, clear summaries that highlight the most important points about consent requirements, reporting procedures, and student rights. Keep summaries to 2-3 sentences maximum."
          },
          {
            role: "user",
            content: `Please summarize the following Title IX policy information:\n\n${titleIXInfo}`
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const summary = completion.choices[0]?.message?.content || "Summary unavailable";

      res.json({ summary });
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // Create Stripe checkout session for verification
  app.post("/api/verify/create-checkout", async (req, res) => {
    try {
      const { universityId, gpuModel } = req.body;

      if (!universityId || !gpuModel) {
        return res.status(400).json({ error: "Missing universityId or gpuModel" });
      }

      const university = await storage.getUniversity(universityId);
      if (!university) {
        return res.status(404).json({ error: "University not found" });
      }

      const prices = {
        "gpt-4": 500,
        "gpt-4-turbo": 300,
        "gpt-4o": 200,
      };

      const price = prices[gpuModel as keyof typeof prices];
      if (!price) {
        return res.status(400).json({ error: "Invalid GPU model" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Title IX Verification - ${university.name}`,
                description: `AI-powered verification using ${gpuModel}`,
              },
              unit_amount: price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/info?verification=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/info?verification=cancelled`,
        metadata: {
          universityId,
          gpuModel,
        },
      });

      const payment = await storage.createVerificationPayment({
        universityId,
        stripeSessionId: session.id,
        amount: price.toString(),
        gpuModel,
        stripePaymentStatus: "pending",
        verificationStatus: "pending",
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Stripe webhook handler
  app.post("/api/verify/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).send("No signature");
    }

    let event: Stripe.Event;

    try {
      const rawBody = (req as any).rawBody;
      
      if (!rawBody) {
        console.error("Webhook error: No raw body available");
        return res.status(400).send("Webhook Error: No raw body");
      }

      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const payment = await storage.getVerificationPaymentBySessionId(session.id);

      if (payment) {
        console.log(`Processing verification payment ${payment.id} for university ${payment.universityId}`);
        
        await storage.updateVerificationPaymentStatus(
          payment.id,
          "paid",
          "processing"
        );

        processVerification(payment.id, payment.universityId, payment.gpuModel);
      } else {
        console.error(`Payment not found for session ${session.id}`);
      }
    }

    res.json({ received: true });
  });

  // Get verification status
  app.get("/api/verify/status/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const payment = await storage.getVerificationPaymentBySessionId(sessionId);

      if (!payment) {
        return res.status(404).json({ error: "Verification not found" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error getting verification status:", error);
      res.status(500).json({ error: "Failed to get verification status" });
    }
  });

  // Referral routes
  app.post("/api/referrals", isAuthenticated, csrfProtection, referralRateLimiter, async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = req.user as any;
      const { refereeEmail, invitationMessage } = req.body;

      if (!refereeEmail) {
        return res.status(400).json({ error: "Referee email is required" });
      }

      // Get referrer's user data for name and referral code
      const referrer = await storage.getUser(user.id);
      if (!referrer) {
        return res.status(404).json({ error: "User not found" });
      }

      // Ensure user has a referral code
      let referralCode = referrer.referralCode;
      if (!referralCode) {
        referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        await storage.updateUserReferralCode(user.id, referralCode);
      }

      // Create referral record
      const referral = await storage.createReferral({
        referrerId: user.id,
        refereeEmail,
        invitationMessage,
        status: "pending",
      });

      // Send invitation email via Resend with error handling
      // Note: We still return success even if email fails, since referral is created
      try {
        const referrerName = referrer.email 
          ? referrer.email.split('@')[0]
          : referrer.firstName || referrer.lastName 
            ? `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim()
            : 'PMY User';
            
        await sendInvitationEmail({
          to: refereeEmail,
          referrerName,
          referralCode,
          personalMessage: invitationMessage || undefined,
        });
      } catch (emailError) {
        console.error("Error sending invitation email via Resend:", emailError);
        // Don't fail the whole request if email fails - referral is still created
        // User will see success message, and we can retry email sending later if needed
      }

      res.json(referral);
    } catch (error) {
      console.error("Error creating referral:", error);
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  app.get("/api/referrals", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = req.user as any;
      const referrals = await storage.getReferralsByUserId(user.id);
      res.json(referrals);
    } catch (error) {
      console.error("Error getting referrals:", error);
      res.status(500).json({ error: "Failed to get referrals" });
    }
  });

  app.get("/api/referrals/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = req.user as any;
      const stats = await storage.getReferralStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error getting referral stats:", error);
      res.status(500).json({ error: "Failed to get referral stats" });
    }
  });

  app.get("/api/user/referral-code", async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = req.user as any;
      const dbUser = await storage.getUser(user.id);
      
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate referral code if user doesn't have one
      if (!dbUser.referralCode) {
        const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        await storage.updateUserReferralCode(user.id, referralCode);
        return res.json({ referralCode });
      }

      res.json({ referralCode: dbUser.referralCode });
    } catch (error) {
      console.error("Error getting referral code:", error);
      res.status(500).json({ error: "Failed to get referral code" });
    }
  });

  // Share document via email
  app.post("/api/share-document", isAuthenticated, csrfProtection, documentShareRateLimiter, async (req, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = req.user as any;
      const { documentId, documentType, recipientEmail } = req.body;

      if (!documentId || !documentType || !recipientEmail) {
        return res.status(400).json({ 
          error: "Document ID, type, and recipient email are required" 
        });
      }

      // Validate document type
      if (!["contract", "recording", "photo", "biometric"].includes(documentType)) {
        return res.status(400).json({ error: "Invalid document type" });
      }

      // Get user data
      const sender = await storage.getUser(user.id);
      if (!sender) {
        return res.status(404).json({ error: "User not found" });
      }

      // SECURITY: Verify ownership FIRST before constructing any document details
      // This prevents leaking metadata about documents the user doesn't own
      if (documentType === "contract") {
        const contract = await storage.getContract(documentId, user.id);
        if (!contract) {
          // Return 404 without leaking any document information
          return res.status(404).json({ error: "Contract not found or access denied" });
        }
        
        // Only construct document details AFTER ownership is verified
        const documentDate = new Date(contract.createdAt).toLocaleDateString();
        const documentDetails = "Digital Signature Consent Contract";
        
        // Send document email via Resend with error handling
        try {
          const senderEmail = sender.email || 'noreply@pmy-consent.app';
          
          await sendDocumentEmail({
            to: recipientEmail,
            from: senderEmail,
            documentType: documentDetails,
            documentDate,
          });
          
          return res.json({ 
            success: true, 
            message: "Document shared successfully" 
          });
        } catch (emailError) {
          console.error("Error sending document email via Resend:", emailError);
          return res.status(502).json({ 
            error: "Failed to send email. Please try again later." 
          });
        }
      } else if (documentType === "recording") {
        const recording = await storage.getRecording(documentId, user.id);
        if (!recording) {
          // Return 404 without leaking any document information
          return res.status(404).json({ error: "Recording not found or access denied" });
        }
        
        // Only construct document details AFTER ownership is verified
        const documentDate = new Date(recording.createdAt).toLocaleDateString();
        const documentDetails = `Audio/Video Consent Recording`;
        
        // Send document email via Resend with error handling
        try {
          const senderEmail = sender.email || 'noreply@pmy-consent.app';
          
          await sendDocumentEmail({
            to: recipientEmail,
            from: senderEmail,
            documentType: documentDetails,
            documentDate,
          });
          
          return res.json({ 
            success: true, 
            message: "Document shared successfully" 
          });
        } catch (emailError) {
          console.error("Error sending document email via Resend:", emailError);
          return res.status(502).json({ 
            error: "Failed to send email. Please try again later." 
          });
        }
      } else {
        // For photo and biometric, we'll add support later
        return res.status(400).json({ 
          error: "Document type not yet supported for email sharing" 
        });
      }
    } catch (error) {
      console.error("Error sharing document:", error);
      res.status(500).json({ error: "Failed to share document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processVerification(paymentId: string, universityId: string, gpuModel: string) {
  try {
    const university = await storage.getUniversity(universityId);
    if (!university) {
      await storage.updateVerificationPaymentStatus(paymentId, "paid", "failed", "University not found");
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: gpuModel as any,
      messages: [
        {
          role: "system",
          content: `You are an expert Title IX compliance analyst. Your task is to verify the accuracy of Title IX policy information for universities. You will receive:
1. University name and official Title IX URL
2. The stored Title IX policy text

Analyze whether the stored information appears accurate, comprehensive, and professional. Consider:
- Does it cover key Title IX topics (prohibited conduct, consent, reporting, resources)?
- Is it written in a professional, informative tone?
- Does it appear to be legitimate policy information (not placeholder text)?
- Is the URL format appropriate for a university Title IX office?

Respond in JSON format:
{
  "verified": true/false,
  "confidence": "high" | "medium" | "low",
  "summary": "Brief explanation of your assessment (2-3 sentences)",
  "recommendations": "Specific improvements needed, if any"
}`
        },
        {
          role: "user",
          content: `University: ${university.name}
Title IX URL: ${university.titleIXUrl || 'Not provided'}

Stored Policy Information:
${university.titleIXInfo}`
        }
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      await storage.updateVerificationPaymentStatus(paymentId, "paid", "failed", "No response from AI");
      return;
    }

    const analysis = JSON.parse(result);

    if (analysis.verified && analysis.confidence === "high") {
      await storage.verifyUniversity(universityId);
    }

    await storage.updateVerificationPaymentStatus(
      paymentId,
      "paid",
      "completed",
      JSON.stringify(analysis)
    );

  } catch (error) {
    console.error("Error processing verification:", error);
    await storage.updateVerificationPaymentStatus(
      paymentId,
      "paid",
      "failed",
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
