import type { Express } from "express";
import { createServer, type Server } from "http";
import storage from "./storage";
import { insertConsentRecordingSchema, insertConsentContractSchema, insertUniversityReportSchema, insertVerificationPaymentSchema, type ConsentContract, shareContractSchema, rejectContractSchema } from "@shared/schema";
import multer from "multer";
import OpenAI from "openai";
import Stripe from "stripe";
import { generateChallenge, verifyAttestation, generateSessionId } from "./webauthn";
import { sendDocumentEmail } from "./email";
import rateLimit from "express-rate-limit";
import { validateFileUpload } from "./fileValidation";
import { logConsentEvent, logRateLimitViolation } from "./securityLogger";
import { requireAuth } from "./supabaseAuth";
import { supabaseAdmin } from "./supabase";

const upload = multer({ storage: multer.memoryStorage() });

// Rate limiting configuration for document sharing endpoint
// Prevents abuse of email-sending functionality
const documentShareRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // Limit each user to 20 document shares per hour
  message: "Too many documents shared. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = req.user;
    return user?.id || 'unauthenticated';
  },
  skipFailedRequests: true,
  handler: (req, res) => {
    const user = req.user;
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

const getStripeKey = (): string | null => {
  const testingKey = process.env.TESTING_STRIPE_SECRET_KEY;
  const prodKey = process.env.STRIPE_SECRET_KEY;
  
  if (process.env.NODE_ENV === 'test' || testingKey) {
    const key = testingKey || prodKey;
    if (key) {
      const keyPrefix = key.substring(0, 7);
      console.log(`[Stripe] Using testing secret key (prefix: ${keyPrefix}...)`);
      return key;
    }
  }
  
  if (prodKey) {
    const keyPrefix = prodKey.substring(0, 7);
    console.log(`[Stripe] Using production secret key (prefix: ${keyPrefix}...)`);
    return prodKey;
  }
  
  console.log('[Stripe] No Stripe keys configured - payment features will be disabled');
  return null;
};

// Initialize Stripe only if keys are available
const stripeKey = getStripeKey();
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: "2025-10-29.clover",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Supabase Auth handles signup/login/password-reset on the client side
  // We only need server endpoints for logout and fetching user data
  
  // Logout endpoint - Supabase handles actual logout on client
  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  // Get current user profile
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Fetch user profile from database
      let profile = await storage.getUserProfile(userId);
      
      // If profile doesn't exist, create it (happens for newly confirmed signups)
      if (!profile) {
        // Generate a unique username from the user ID with collision safety
        let generatedUsername = `user_${userId.substring(0, 8)}`;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
          try {
            await storage.createUserProfile({
              id: userId,
              username: generatedUsername,
              savedSignature: null,
              savedSignatureType: null,
              savedSignatureText: null,
              dataRetentionPolicy: "forever",
              stripeCustomerId: null,
              referralCode: null,
            });
            break; // Success
          } catch (error: unknown) {
            // If username collision, retry with timestamp
            if (error instanceof Error && (error.message.includes("unique") || error.message.includes("duplicate"))) {
              attempts++;
              generatedUsername = `user_${userId.substring(0, 8)}_${Date.now().toString().slice(-6)}`;
            } else {
              throw error; // Re-throw other errors
            }
          }
        }
        
        if (attempts >= maxAttempts) {
          return res.status(500).json({ error: "Failed to generate unique username" });
        }
        
        profile = await storage.getUserProfile(userId);
      }
      
      // Name comes from Supabase user_metadata (stored during signup)
      const name = req.user!.name || null;
      
      return res.json({
        user: {
          id: userId,
          email: req.user!.email,
          name: name,
          firstName: null,
          lastName: null,
          dataRetentionPolicy: profile?.dataRetentionPolicy || "forever",
          createdAt: new Date().toISOString(),
          authMethod: "supabase",
          savedSignature: profile?.savedSignature || null,
          savedSignatureType: profile?.savedSignatureType || null,
          savedSignatureText: profile?.savedSignatureText || null,
        },
        profile: {
          username: profile?.username || null,
          profilePictureUrl: profile?.profilePictureUrl || null,
          bio: profile?.bio || null,
          websiteUrl: profile?.websiteUrl || null,
        },
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // Get profile stats
  app.get("/api/profile/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get all contracts
      const contracts = await storage.getContractsByUserId(userId);
      
      // Count active contracts (contracts with end time in the future)
      const now = new Date();
      const activeContracts = contracts.filter((c: ConsentContract) => 
        c.contractEndTime && new Date(c.contractEndTime) > now
      ).length;
      
      // Get all recordings
      const recordings = await storage.getRecordingsByUserId(userId);
      
      return res.json({
        totalContracts: contracts.length,
        activeContracts: activeContracts,
        totalRecordings: recordings.length,
      });
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      return res.status(500).json({ error: "Failed to fetch profile stats" });
    }
  });

  // Search users by username (for social features / collaboration)
  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      if (query.length < 2) {
        return res.status(400).json({ error: "Query must be at least 2 characters" });
      }
      
      // Search for users by username (supports '@' prefix)
      const users = await storage.searchUsersByUsername(query, 10);
      
      // Return limited profile information for privacy
      const results = users.map(user => ({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio,
      }));
      
      return res.json({ users: results });
    } catch (error) {
      console.error("Error searching users:", error);
      return res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Update profile information
  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const { profilePictureUrl, bio, websiteUrl } = req.body;
      const userId = req.user!.id;
      
      // Validate inputs
      if (bio && typeof bio !== "string") {
        return res.status(400).json({ error: "Invalid bio" });
      }
      
      if (websiteUrl && typeof websiteUrl !== "string") {
        return res.status(400).json({ error: "Invalid website URL" });
      }
      
      if (profilePictureUrl && typeof profilePictureUrl !== "string") {
        return res.status(400).json({ error: "Invalid profile picture URL" });
      }
      
      // Prepare updates
      const updates: any = {};
      if (profilePictureUrl !== undefined) updates.profilePictureUrl = profilePictureUrl;
      if (bio !== undefined) updates.bio = bio;
      if (websiteUrl !== undefined) updates.websiteUrl = websiteUrl;
      
      // Update profile
      await storage.updateUserProfile(userId, updates);
      
      return res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Get user preferences (consent flow defaults)
  app.get("/api/profile/preferences", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const preferences = await storage.getUserPreferences(userId);
      
      return res.json(preferences || {
        defaultUniversityId: null,
        stateOfResidence: null,
        defaultEncounterType: null,
        defaultContractDuration: null,
      });
    } catch (error) {
      console.error("Get preferences error:", error);
      return res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // Update user preferences (consent flow defaults)
  app.patch("/api/profile/preferences", requireAuth, async (req, res) => {
    try {
      const { defaultUniversityId, stateOfResidence, defaultEncounterType, defaultContractDuration } = req.body;
      const userId = req.user!.id;
      
      // Validate inputs
      if (defaultUniversityId && typeof defaultUniversityId !== "string") {
        return res.status(400).json({ error: "Invalid university ID" });
      }
      
      if (stateOfResidence && typeof stateOfResidence !== "string") {
        return res.status(400).json({ error: "Invalid state of residence" });
      }
      
      if (defaultEncounterType && typeof defaultEncounterType !== "string") {
        return res.status(400).json({ error: "Invalid encounter type" });
      }
      
      if (defaultContractDuration && typeof defaultContractDuration !== "number") {
        return res.status(400).json({ error: "Invalid contract duration" });
      }
      
      // Prepare updates
      const updates: any = {};
      if (defaultUniversityId !== undefined) updates.defaultUniversityId = defaultUniversityId;
      if (stateOfResidence !== undefined) updates.stateOfResidence = stateOfResidence;
      if (defaultEncounterType !== undefined) updates.defaultEncounterType = defaultEncounterType;
      if (defaultContractDuration !== undefined) updates.defaultContractDuration = defaultContractDuration;
      
      // Update preferences
      await storage.updateUserPreferences(userId, updates);
      
      return res.json({ success: true, message: "Preferences updated successfully" });
    } catch (error) {
      console.error("Update preferences error:", error);
      return res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Get user saved contacts
  app.get("/api/profile/contacts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const contacts = await storage.getUserContacts(userId);
      return res.json(contacts);
    } catch (error) {
      console.error("Get contacts error:", error);
      return res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  // Add a new contact
  app.post("/api/profile/contacts", requireAuth, async (req, res) => {
    try {
      const { contactUsername, nickname } = req.body;
      const userId = req.user!.id;
      
      if (!contactUsername || typeof contactUsername !== "string") {
        return res.status(400).json({ error: "Valid contact username is required" });
      }
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(contactUsername) || contactUsername.length < 3 || contactUsername.length > 30) {
        return res.status(400).json({ error: "Invalid username format" });
      }
      
      // Verify that the username exists
      const contactUser = await storage.getUserByUsername(contactUsername);
      if (!contactUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if user is trying to add themselves
      if (contactUser.id === userId) {
        return res.status(400).json({ error: "You cannot add yourself as a contact" });
      }
      
      // Check if contact already exists
      const existingContacts = await storage.getUserContacts(userId);
      const alreadyExists = existingContacts.some(c => c.contactUsername === contactUsername);
      if (alreadyExists) {
        return res.status(400).json({ error: "Contact already exists" });
      }
      
      const contact = await storage.addUserContact(userId, contactUsername, nickname);
      return res.json(contact);
    } catch (error) {
      console.error("Add contact error:", error);
      return res.status(500).json({ error: "Failed to add contact" });
    }
  });

  // Delete a contact
  app.delete("/api/profile/contacts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const success = await storage.deleteUserContact(id, userId);
      if (!success) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      return res.json({ success: true, message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Delete contact error:", error);
      return res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Update user data retention policy
  app.patch("/api/auth/retention-policy", requireAuth, async (req, res) => {
    try {
      const { dataRetentionPolicy } = req.body;
      const userId = req.user!.id;
      
      const validPolicies = ["30days", "90days", "1year", "forever"];
      if (!dataRetentionPolicy || !validPolicies.includes(dataRetentionPolicy)) {
        return res.status(400).json({ error: "Invalid retention policy" });
      }

      await storage.updateUserRetentionPolicy(userId, dataRetentionPolicy);

      return res.json({ success: true, message: "Retention policy updated successfully" });
    } catch (error) {
      console.error("Update retention policy error:", error);
      return res.status(500).json({ error: "Failed to update retention policy" });
    }
  });

  // Change user email - updates both Supabase Auth and user profile
  app.patch("/api/auth/change-email", requireAuth, async (req, res) => {
    try {
      const { newEmail } = req.body;
      const userId = req.user!.id;
      
      if (!newEmail || typeof newEmail !== "string") {
        return res.status(400).json({ error: "Valid email is required" });
      }

      // Normalize email (trim and lowercase)
      const normalizedEmail = newEmail.trim().toLowerCase();
      
      if (!normalizedEmail) {
        return res.status(400).json({ error: "Valid email is required" });
      }

      // Update email in Supabase Auth using Admin API
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email: normalizedEmail }
      );

      if (error) {
        console.error("Failed to update email in Supabase Auth:", error);
        return res.status(400).json({ error: error.message });
      }

      return res.json({ success: true, message: "Email updated successfully" });
    } catch (error) {
      console.error("Change email error:", error);
      return res.status(500).json({ error: "Failed to update email" });
    }
  });

  // Delete all user data (contracts, recordings)
  app.delete("/api/auth/delete-all-data", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Delete all recordings and contracts for this user
      await storage.deleteAllUserData(userId);

      return res.json({ 
        success: true, 
        message: "All data has been permanently deleted" 
      });
    } catch (error) {
      console.error("Delete all data error:", error);
      return res.status(500).json({ error: "Failed to delete data" });
    }
  });

  // Delete entire user account - removes from Supabase Auth and database
  app.delete("/api/auth/delete-account", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Delete user profile and all associated data from database
      await storage.deleteUserProfile(userId);
      
      // Delete user from Supabase Auth using Admin API
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error("Failed to delete user from Supabase Auth:", error);
        return res.status(500).json({ error: "Failed to delete account" });
      }

      return res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      return res.status(500).json({ error: "Failed to delete account" });
    }
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
  app.get("/api/recordings", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const recordings = await storage.getRecordingsByUserId(userId);
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recordings" });
    }
  });

  // Upload a new recording (requires authentication)
  app.post("/api/recordings", requireAuth, upload.single("audio"), validateFileUpload("audio"), async (req, res) => {
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
      const userId = req.user!.id;

      // Save to storage
      const recording = await storage.createRecording({
        userId,
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
  app.delete("/api/recordings/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const deleted = await storage.deleteRecording(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Recording not found or unauthorized" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recording" });
    }
  });

  // Get user's contracts (requires authentication)
  app.get("/api/contracts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const contracts = await storage.getContractsByUserId(userId);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  // Get a single contract (requires authentication and ownership)
  app.get("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const contract = await storage.getContract(id, userId);
      
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  // Create a new contract (requires authentication)
  app.post("/api/contracts", requireAuth, async (req, res) => {
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
      const userId = req.user!.id;
      const contract = await storage.createContract({
        ...parsed.data,
        userId
      });
      
      // Save user's OWN signature (signature1) if requested
      // This ensures we never accidentally save the partner's signature
      if (shouldSave === true && parsed.data.signature1) {
        await storage.updateUserSignature(
          userId,
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
  app.delete("/api/contracts/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const deleted = await storage.deleteContract(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Contract not found or unauthorized" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });

  // Pause an active contract
  app.post("/api/contracts/:id/pause", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const contract = await storage.pauseContract(id, userId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found, unauthorized, or not in active status" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error pausing contract:", error);
      res.status(500).json({ error: "Failed to pause contract" });
    }
  });

  // Resume a paused contract
  app.post("/api/contracts/:id/resume", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const contract = await storage.resumeContract(id, userId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found, unauthorized, or not in paused status" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error resuming contract:", error);
      res.status(500).json({ error: "Failed to resume contract" });
    }
  });

  // New consent creation endpoints with enhanced fields (requires authentication)
  app.post("/api/consent-contracts", requireAuth, async (req, res) => {
    try {
      console.log("[ConsentContract] Received request body duration fields:", {
        contractStartTime: req.body.contractStartTime,
        contractDuration: req.body.contractDuration,
        contractEndTime: req.body.contractEndTime
      });
      
      const parsed = insertConsentContractSchema.safeParse(req.body);
      
      if (!parsed.success) {
        console.error("Validation error:", parsed.error);
        return res.status(400).json({ error: "Invalid contract data", details: parsed.error });
      }
      
      console.log("[ConsentContract] After validation, duration fields:", {
        contractStartTime: parsed.data.contractStartTime,
        contractDuration: parsed.data.contractDuration,
        contractEndTime: parsed.data.contractEndTime
      });

      // Validate all parties use canonical @username format (lowercase alphanumeric_underscore)
      if (parsed.data.parties && parsed.data.parties.length > 0) {
        const usernameRegex = /^@[a-z0-9_]+$/;
        const invalidParties = parsed.data.parties.filter((party: string) => {
          const trimmed = party.trim();
          return trimmed && !usernameRegex.test(trimmed);
        });
        if (invalidParties.length > 0) {
          return res.status(400).json({ 
            error: "All parties must use canonical @username format (lowercase letters, numbers, underscores only)",
            invalidParties: invalidParties
          });
        }
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
      const userId = req.user!.id;
      const contract = await storage.createContract({
        ...parsed.data,
        userId
      });
      
      // Log consent creation
      logConsentEvent(
        req,
        "create_contract",
        "contract",
        contract.id,
        userId,
        { method: parsed.data.method }
      );
      
      res.json(contract);
    } catch (error) {
      console.error("Error creating consent contract:", error);
      const userId = req.user?.id;
      if (userId) {
        logConsentEvent(
          req,
          "create_failure",
          "contract",
          undefined,
          userId,
          { method: req.body.method, error: (error as Error).message }
        );
      }
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  app.post("/api/consent-recordings", requireAuth, upload.single("audio"), validateFileUpload("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const { universityId, encounterType, parties, duration, contractText, contractStartTime, contractDuration, contractEndTime } = req.body;

      if (!duration) {
        return res.status(400).json({ error: "Missing required field: duration" });
      }

      // Parse parties JSON string
      const parsedParties = parties ? JSON.parse(parties) : [];

      // Store as data URL
      const fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const filename = `consent-${Date.now()}.webm`;

      // SECURITY: Set userId from authenticated user to prevent Tea App-style data leaks
      const userId = req.user!.id;

      // First save the recording for reference
      const recording = await storage.createRecording({
        userId,
        universityId: universityId || undefined,
        encounterType: encounterType || undefined,
        parties: parsedParties,
        filename,
        fileUrl,
        duration,
      });

      // Create a contract with the audio recording (status: draft until Press for Yes)
      const contract = await storage.createContract({
        userId,
        universityId: universityId || undefined,
        encounterType: encounterType || undefined,
        parties: parsedParties,
        contractStartTime: contractStartTime ? new Date(contractStartTime).toISOString() : undefined,
        contractDuration: contractDuration ? parseInt(contractDuration) : undefined,
        contractEndTime: contractEndTime ? new Date(contractEndTime).toISOString() : undefined,
        method: "voice",
        contractText: contractText || `Voice consent recorded on ${new Date().toLocaleDateString()} for ${encounterType || "encounter"}. Duration: ${duration} seconds.`,
        signature1: fileUrl,
        signature2: `Voice recording ${filename}`,
        status: "draft",
        isCollaborative: "false",
      });

      // Log consent creation
      logConsentEvent(
        req,
        "create_recording",
        "contract",
        contract.id,
        userId,
        { duration, encounterType, method: "voice" }
      );

      res.json(contract);
    } catch (error) {
      console.error("Error uploading consent recording:", error);
      const userId = req.user?.id;
      if (userId) {
        logConsentEvent(
          req,
          "create_failure",
          "contract",
          undefined,
          userId,
          { error: (error as Error).message }
        );
      }
      res.status(500).json({ error: "Failed to upload recording" });
    }
  });

  app.post("/api/consent-photos", requireAuth, upload.single("photo"), validateFileUpload("photo"), async (req, res) => {
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
      const userId = req.user!.id;

      // Create a contract with the photo (status: draft until Press for Yes)
      const contract = await storage.createContract({
        userId,
        universityId: universityId || undefined,
        encounterType: encounterType || undefined,
        parties: parsedParties,
        method: "photo",
        contractText: `Photo consent uploaded on ${new Date().toLocaleDateString()} for ${encounterType || "encounter"}`,
        signature1: "Photo upload by party 1",
        signature2: "Mutual consent shown in photo",
        photoUrl,
        status: "draft",
        isCollaborative: "false",
      });

      // Log consent creation
      logConsentEvent(
        req,
        "create_photo",
        "contract",
        contract.id,
        userId,
        { method: "photo", encounterType }
      );

      res.json(contract);
    } catch (error) {
      console.error("Error uploading consent photo:", error);
      const userId = req.user?.id;
      if (userId) {
        logConsentEvent(
          req,
          "create_failure",
          "contract",
          undefined,
          userId,
          { method: "photo", error: (error as Error).message }
        );
      }
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  app.post("/api/consent-biometric", requireAuth, async (req, res) => {
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
      const userId = req.user!.id;

      // Create contract with verified biometric data (status: draft until Press for Yes)
      const contract = await storage.createContract({
        ...parsed.data,
        userId,
        status: "draft",
        isCollaborative: "false",
      });

      // Log consent creation
      logConsentEvent(
        req,
        "create_biometric",
        "contract",
        contract.id,
        userId,
        { method: "biometric", encounterType: parsed.data.encounterType }
      );

      res.json(contract);
    } catch (error) {
      console.error("Error creating biometric consent:", error);
      const userId = req.user?.id;
      if (userId) {
        logConsentEvent(
          req,
          "create_failure",
          "contract",
          undefined,
          userId,
          { method: "biometric", error: (error as Error).message }
        );
      }
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
      // Check if Stripe is configured
      if (!stripe) {
        return res.status(503).json({ 
          error: "Payment processing is not available",
          details: "Stripe is not configured on this server"
        });
      }

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
    // Check if Stripe is configured
    if (!stripe) {
      console.error("[Stripe Webhook] Stripe not configured");
      return res.status(503).send("Payment processing is not available");
    }

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

  // Share document via email
  app.post("/api/share-document", requireAuth, documentShareRateLimiter, async (req, res) => {
    try {
      const user = req.user!;
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

      // Get user profile
      const sender = await storage.getUserProfile(user.id);
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
          const senderEmail = user.email || 'noreply@pmy-consent.app';
          
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
          const senderEmail = user.email || 'noreply@pmy-consent.app';
          
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

  // ===== Collaborative Contract Endpoints =====
  
  // Get user's draft contracts
  app.get("/api/contracts/drafts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const drafts = await storage.getDraftsByUserId(userId);
      res.json(drafts);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      res.status(500).json({ error: "Failed to fetch drafts" });
    }
  });

  // Create a draft contract (doesn't require signatures)
  app.post("/api/contracts/draft", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Validate basic required fields
      const { encounterType, parties, method, contractText, ...rest } = req.body;
      
      if (!encounterType || !encounterType.trim()) {
        return res.status(400).json({ error: "Encounter type is required" });
      }
      
      if (!Array.isArray(parties) || parties.length === 0) {
        return res.status(400).json({ error: "At least one party is required" });
      }
      
      if (!method) {
        return res.status(400).json({ error: "Method is required" });
      }
      
      if (!contractText) {
        return res.status(400).json({ error: "Contract text is required" });
      }
      
      // Create draft contract with status "draft"
      const contract = await storage.createContract({
        ...rest,
        userId,
        encounterType,
        parties,
        method,
        contractText,
        status: "draft",
        isCollaborative: rest.isCollaborative || false,
        // Drafts don't have signatures yet
        signature1: null,
        signature2: null,
      });
      
      res.json(contract);
    } catch (error) {
      console.error("Error creating draft:", error);
      res.status(500).json({ error: "Failed to create draft" });
    }
  });

  // Update an existing draft contract
  app.patch("/api/contracts/draft/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const updated = await storage.updateDraft(id, userId, req.body);
      
      if (!updated) {
        return res.status(404).json({ error: "Draft not found or cannot be updated" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating draft:", error);
      res.status(500).json({ error: "Failed to update draft" });
    }
  });

  // Get contracts user is collaborating on
  app.get("/api/contracts/shared", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const sharedContracts = await storage.getSharedContractsByUserId(userId);
      res.json(sharedContracts);
    } catch (error) {
      console.error("Error fetching shared contracts:", error);
      res.status(500).json({ error: "Failed to fetch shared contracts" });
    }
  });

  // Share a contract with another user via email invitation
  app.post("/api/contracts/:id/share", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userEmail = req.user!.email || '';

      // Validate request body with Zod
      const validation = shareContractSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: validation.error.errors 
        });
      }

      const { recipientEmail, recipientUserId } = validation.data;

      // Verify ownership: only the owner can share
      // getContract returns undefined if contract doesn't exist OR user doesn't have access
      const contract = await storage.getContract(id, userId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found or unauthorized" });
      }

      // Explicit ownership check: verify user created this contract
      if (contract.userId !== userId) {
        return res.status(403).json({ error: "Only the contract owner can share it" });
      }

      // Only draft or pending_approval contracts can be shared
      if (contract.status !== 'draft' && contract.status !== 'pending_approval') {
        return res.status(400).json({ 
          error: `Cannot share ${contract.status} contracts. Only draft or pending contracts can be shared.` 
        });
      }

      // Determine recipient type and share accordingly
      let result;
      if (recipientUserId) {
        // PMY user: Create collaborator directly (native in-app collaboration)
        result = await storage.shareContract(id, userId, userEmail, recipientUserId);
      } else if (recipientEmail) {
        // External email: Use email-based invitation flow
        result = await storage.shareContract(id, userId, userEmail, undefined, recipientEmail);
      } else {
        return res.status(400).json({ error: "Either recipientEmail or recipientUserId must be provided" });
      }
      
      // Return success based on recipient type
      if (recipientUserId) {
        // PMY user: Collaborator created (in-app)
        res.json({
          success: true,
          collaboratorId: result.collaboratorId,
          message: "Contract shared with PMY user successfully. They can now view and approve in their Inbox."
        });
      } else {
        // External email: Invitation sent
        res.json({
          success: true,
          invitationId: result.invitationId,
          invitationCode: result.invitationCode,
          message: "Contract shared successfully. Invitation code can be shared with recipient."
        });
      }
    } catch (error) {
      console.error("Error sharing contract:", error);
      
      // Map storage errors to appropriate HTTP status codes
      if (error instanceof Error) {
        if (error.message.includes("Cannot invite yourself")) {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes("already invited") || error.message.includes("duplicate")) {
          return res.status(409).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to share contract" });
    }
  });

  // Get all invitations for current user
  app.get("/api/contracts/invitations", requireAuth, async (req, res) => {
    try {
      const userEmail = req.user!.email;
      
      if (!userEmail) {
        return res.status(400).json({ error: "User email not found" });
      }
      
      // Get all invitations for this user's email
      const allInvitations = await storage.getInvitationsByRecipientEmail(userEmail);
      
      res.json(allInvitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  // Get in-app PMY user invitations (pending collaborator invitations)
  app.get("/api/contracts/invitations/pmy", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get pending in-app invitations where user is a recipient with pending status
      const pendingInvitations = await storage.getPendingInAppInvitations(userId);
      
      res.json(pendingInvitations);
    } catch (error) {
      console.error("Error fetching PMY invitations:", error);
      res.status(500).json({ error: "Failed to fetch PMY invitations" });
    }
  });

  // Get invitation details by code (public endpoint - no auth required)
  app.get("/api/contracts/invitations/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const invitation = await storage.getInvitationByCode(code);
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found or expired" });
      }

      // Check if invitation is still pending
      if (invitation.status !== 'pending') {
        return res.status(400).json({ 
          error: `Invitation has already been ${invitation.status}` 
        });
      }

      // Check if invitation has expired (7 days)
      const expiresAt = new Date(invitation.expiresAt);
      if (expiresAt < new Date()) {
        return res.status(400).json({ error: "Invitation has expired" });
      }

      // Return invitation details (sanitized - no email leakage to unauthenticated users)
      res.json({
        contractId: invitation.contractId,
        expiresAt: invitation.expiresAt,
        status: invitation.status
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ error: "Failed to fetch invitation" });
    }
  });

  // Accept a contract invitation and become a collaborator
  app.post("/api/contracts/invitations/:code/accept", requireAuth, async (req, res) => {
    try {
      const { code } = req.params;
      const userId = req.user!.id;

      const result = await storage.acceptInvitation(code, userId);
      
      if (!result) {
        return res.status(400).json({ 
          error: "Invalid invitation code or invitation already processed" 
        });
      }

      res.json({
        success: true,
        contractId: result.contractId,
        message: "Invitation accepted. You can now review and approve the contract."
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      
      // Map storage errors to appropriate HTTP status codes
      if (error instanceof Error) {
        if (error.message.includes("not found") || error.message.includes("expired")) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes("already accepted") || error.message.includes("already a collaborator")) {
          return res.status(409).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // Approve a collaborative contract
  app.post("/api/contracts/:id/approve", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Verify user has access (owner or collaborator) using targeted query to prevent unauthorized enumeration
      const hasAccess = await storage.hasContractAccess(id, userId);
      
      // Return uniform 404 for unauthorized access AND all storage failures
      // This prevents leaking information about contract existence or user's relationship to it
      if (!hasAccess) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Attempt to approve - storage enforces pending-status guard
      const approved = await storage.approveContract(id, userId);
      
      if (!approved) {
        // Storage returned false - could be:
        // - User not a collaborator, - Already approved, - Already rejected, - Wrong contract status
        // Return same 404 to prevent leaking state information
        return res.status(404).json({ error: "Contract not found" });
      }

      // Refetch contract to get updated status
      const updated = await storage.getContractsByUserId(userId).then(contracts => contracts.find(c => c.id === id)) ||
                     await storage.getSharedContractsByUserId(userId).then(contracts => contracts.find(c => c.id === id));
      
      res.json({
        success: true,
        message: "Contract approved successfully",
        contractStatus: updated?.status || 'active'
      });
    } catch (error) {
      console.error("Error approving contract:", error);
      res.status(500).json({ error: "Failed to approve contract" });
    }
  });

  // Reject a collaborative contract
  app.post("/api/contracts/:id/reject", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Validate request body with Zod
      const validation = rejectContractSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: validation.error.errors 
        });
      }

      const { reason } = validation.data;

      // Verify user has access (owner or collaborator) using targeted query to prevent unauthorized enumeration
      const hasAccess = await storage.hasContractAccess(id, userId);
      
      // Return uniform 404 for unauthorized access AND all storage failures
      // This prevents leaking information about contract existence or user's relationship to it
      if (!hasAccess) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Attempt to reject - storage enforces pending-status guard
      const rejected = await storage.rejectContract(id, userId, reason);
      
      if (!rejected) {
        // Storage returned false - could be:
        // - User not a collaborator, - Already approved, - Already rejected, - Wrong contract status
        // Return same 404 to prevent leaking state information
        return res.status(404).json({ error: "Contract not found" });
      }

      res.json({
        success: true,
        message: "Contract rejected successfully"
      });
    } catch (error) {
      console.error("Error rejecting contract:", error);
      res.status(500).json({ error: "Failed to reject contract" });
    }
  });

  // Confirm consent (Press for Yes) - final activation step
  app.post("/api/contracts/:id/confirm-consent", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Verify user has access (owner or collaborator)
      const hasAccess = await storage.hasContractAccess(id, userId);
      
      if (!hasAccess) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Confirm consent for this user
      const result = await storage.confirmConsent(id, userId);
      
      if (!result) {
        return res.status(404).json({ error: "Contract not found" });
      }

      res.json({
        success: true,
        message: result.allPartiesConfirmed 
          ? "All parties confirmed! Contract is now active." 
          : "Your confirmation recorded. Waiting for other parties.",
        allPartiesConfirmed: result.allPartiesConfirmed,
        contractStatus: result.contractStatus
      });
    } catch (error) {
      console.error("Error confirming consent:", error);
      res.status(500).json({ error: "Failed to confirm consent" });
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
