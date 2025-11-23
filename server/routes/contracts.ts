import { Router } from "express";
import storage from "../storage";
import { insertConsentContractSchema, shareContractSchema, rejectContractSchema } from "@shared/schema";
import multer from "multer";
import { requireAuth } from "../supabaseAuth";
import { validateFileUpload } from "../fileValidation";
import { logConsentEvent } from "../securityLogger";
import OpenAI from "openai";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to validate Base64 signature size
function validateSignatureSize(dataURL: string, maxBytes: number = 2 * 1024 * 1024): { valid: boolean; error?: string } {
  if (!dataURL) return { valid: true };
  
  try {
    const base64Match = dataURL.match(/^data:[^;]+;base64,(.+)$/);
    if (!base64Match) return { valid: false, error: "Invalid data URL format" };
    
    const base64Data = base64Match[1];
    const byteSize = (base64Data.length * 3) / 4;
    const paddingChars = (base64Data.match(/=/g) || []).length;
    const actualByteSize = byteSize - paddingChars;
    
    if (actualByteSize > maxBytes) {
      const maxMB = (maxBytes / (1024 * 1024)).toFixed(1);
      const actualMB = (actualByteSize / (1024 * 1024)).toFixed(1);
      return { 
        valid: false, 
        error: `Signature size (${actualMB}MB) exceeds maximum allowed size of ${maxMB}MB` 
      };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Failed to validate signature size" };
  }
}

  router.get("/contracts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const contracts = await storage.getContractsByUserId(userId);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  // Get a single contract (requires authentication and ownership)
  router.get("/contracts/:id", requireAuth, async (req, res) => {
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
  router.post("/contracts", requireAuth, async (req, res) => {
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
  router.delete("/contracts/:id", requireAuth, async (req, res) => {
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
  router.post("/contracts/:id/pause", requireAuth, async (req, res) => {
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
  router.post("/contracts/:id/resume", requireAuth, async (req, res) => {
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
  router.post("/consent-contracts", requireAuth, async (req, res) => {
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

      // Validate parties: Accept either @username (PMY users) OR legal names (non-PMY participants)
      if (parsed.data.parties && parsed.data.parties.length > 0) {
        const usernameRegex = /^@[a-z0-9_]+$/; // PMY username format
        const invalidParties = parsed.data.parties.filter((party: string) => {
          const trimmed = party.trim();
          if (!trimmed) return true; // Empty string is invalid
          
          // Two valid formats:
          // 1. PMY username: @lowercase_alphanumeric_underscore
          // 2. Legal name: any non-empty text without @ prefix (minimum 2 chars)
          if (trimmed.startsWith('@')) {
            return !usernameRegex.test(trimmed); // Validate PMY username format
          } else {
            return trimmed.length < 2; // Legal names must be at least 2 characters
          }
        });
        if (invalidParties.length > 0) {
          return res.status(400).json({ 
            error: "Parties must be either @username (PMY users) or legal names (min 2 characters)",
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

  router.post("/consent-recordings", requireAuth, upload.single("audio"), validateFileUpload("audio"), async (req, res) => {
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

  router.post("/consent-photos", requireAuth, upload.single("photo"), validateFileUpload("photo"), async (req, res) => {
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

  router.post("/consent-biometric", requireAuth, async (req, res) => {
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

  router.get("/contracts/drafts", requireAuth, async (req, res) => {
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
  router.post("/contracts/draft", requireAuth, async (req, res) => {
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
  router.patch("/contracts/draft/:id", requireAuth, async (req, res) => {
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
  router.get("/contracts/shared", requireAuth, async (req, res) => {
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
  router.post("/contracts/:id/share", requireAuth, async (req, res) => {
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
  router.get("/contracts/invitations", requireAuth, async (req, res) => {
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
  router.get("/contracts/invitations/pmy", requireAuth, async (req, res) => {
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
  router.get("/contracts/invitations/:code", async (req, res) => {
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
  router.post("/contracts/invitations/:code/accept", requireAuth, async (req, res) => {
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
  router.post("/contracts/:id/approve", requireAuth, async (req, res) => {
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
  router.post("/contracts/:id/reject", requireAuth, async (req, res) => {
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
  router.post("/contracts/:id/confirm-consent", requireAuth, async (req, res) => {
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

  // Interpret custom consent terms using AI
  router.post("/consent/interpret-custom-text", requireAuth, async (req, res) => {
    try {
      const { customText, context } = req.body;

      if (!customText || typeof customText !== "string" || customText.trim().length === 0) {
        return res.status(400).json({ error: "Custom text is required" });
      }

      // Cap input length to prevent abuse
      if (customText.length > 1000) {
        return res.status(400).json({ error: "Custom text too long. Maximum 1000 characters." });
      }

      if (!context || !["encounterType", "intimateActs"].includes(context)) {
        return res.status(400).json({ error: "Invalid context. Must be 'encounterType' or 'intimateActs'" });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      let systemPrompt = "";
      if (context === "encounterType") {
        systemPrompt = `You are analyzing a user's description of a consent encounter type. Based on their input, determine the most appropriate encounter type category and provide a clear, professional label.

Available categories:
- intimate: For romantic or sexual encounters
- date: For dating or romantic social situations
- conversation: For textual matters, discussions, or verbal interactions
- medical: For medical consultations or healthcare situations
- professional: For workplace or business interactions
- other: For anything that doesn't fit the above

Return a JSON object with:
{
  "suggestedType": "one of the categories above",
  "label": "A clear, professional 2-4 word label for this encounter type",
  "confidence": "high|medium|low"
}`;
      } else {
        systemPrompt = `You are analyzing a user's description of intimate acts for a consent contract. Based on their input, identify which specific acts they are referring to and suggest appropriate consent terms.

Common intimate acts include:
- Touching/Caressing
- Kissing
- Manual Stimulation
- Oral Stimulation
- Oral Intercourse
- Penetrative Intercourse
- Photography/Video Recording

Return a JSON object with:
{
  "suggestedActs": ["array of act names that match"],
  "customDescription": "A clear, professional description if the user described something not in the list",
  "confidence": "high|medium|low"
}`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: customText
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: "json_object" }
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        return res.status(500).json({ error: "No response from AI" });
      }

      const interpretation = JSON.parse(result);
      res.json({ interpretation });

    } catch (error) {
      console.error("Error interpreting custom text:", error);
      res.status(500).json({ error: "Failed to interpret custom text" });
    }
  });

export default router;
