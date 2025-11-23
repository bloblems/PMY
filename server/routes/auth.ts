/**
 * Auth Routes
 * 
 * Handles user authentication, account management, and data retention.
 */

import { Router } from "express";
import { requireAuth } from "../supabaseAuth";
import storage from "../storage";
import { supabaseAdmin } from "../supabase";

const router = Router();

// Logout endpoint - Supabase handles actual logout on client
router.post("/logout", (req, res) => {
  res.json({ success: true });
});

// Get current user profile
router.get("/me", requireAuth, async (req, res) => {
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
        isVerified: profile?.isVerified || "false",
        verificationProvider: profile?.verificationProvider || null,
        verifiedAt: profile?.verifiedAt?.toISOString() || null,
        verificationLevel: profile?.verificationLevel || null,
        referralCount: profile?.referralCount || 0,
      },
      profile: {
        username: profile?.username || null,
        profilePictureUrl: profile?.profilePictureUrl || null,
        bio: profile?.bio || null,
        websiteUrl: profile?.websiteUrl || null,
        isVerified: profile?.isVerified || "false",
        verificationProvider: profile?.verificationProvider || null,
        verifiedAt: profile?.verifiedAt?.toISOString() || null,
        verificationLevel: profile?.verificationLevel || null,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Update user data retention policy
router.patch("/retention-policy", requireAuth, async (req, res) => {
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
router.patch("/change-email", requireAuth, async (req, res) => {
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
router.delete("/delete-all-data", requireAuth, async (req, res) => {
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
router.delete("/delete-account", requireAuth, async (req, res) => {
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

export default router;
