/**
 * Profile Routes
 * 
 * Handles user profile management, preferences, contacts, and stats.
 */

import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../supabaseAuth";
import { validateFileUpload } from "../fileValidation";
import storage from "../storage";
import type { ConsentContract } from "@shared/schema";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get profile stats
router.get("/stats", requireAuth, async (req, res) => {
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

// Upload profile picture
router.post("/upload-picture", requireAuth, upload.single("picture"), validateFileUpload("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No picture file provided" });
    }

    const userId = req.user!.id;

    // Store picture as data URL
    const profilePictureUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // Update profile with new picture
    await storage.updateUserProfile(userId, { profilePictureUrl });

    return res.json({ success: true, profilePictureUrl });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    return res.status(500).json({ error: "Failed to upload profile picture" });
  }
});

// Update profile information
router.patch("/", requireAuth, async (req, res) => {
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
router.get("/preferences", requireAuth, async (req, res) => {
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
router.patch("/preferences", requireAuth, async (req, res) => {
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
router.get("/contacts", requireAuth, async (req, res) => {
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
router.post("/contacts", requireAuth, async (req, res) => {
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
router.delete("/contacts/:id", requireAuth, async (req, res) => {
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

export default router;
