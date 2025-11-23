/**
 * Recordings Routes
 * 
 * Handles audio/video consent recording CRUD operations.
 */

import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../supabaseAuth";
import { validateFileUpload } from "../fileValidation";
import storage from "../storage";
import { uploadRateLimiter, stateChangeRateLimiter } from "../middleware/rateLimiting";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get user's recordings
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const recordings = await storage.getRecordingsByUserId(userId);
    res.json(recordings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recordings" });
  }
});

// Upload a new recording
router.post("/", uploadRateLimiter, requireAuth, upload.single("audio"), validateFileUpload("audio"), async (req, res) => {
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

// Delete a recording
router.delete("/:id", stateChangeRateLimiter, requireAuth, async (req, res) => {
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

export default router;
