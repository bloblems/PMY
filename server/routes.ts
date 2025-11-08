import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConsentRecordingSchema, insertConsentContractSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all universities
  app.get("/api/universities", async (_req, res) => {
    try {
      const universities = await storage.getAllUniversities();
      res.json(universities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch universities" });
    }
  });

  // Get all recordings
  app.get("/api/recordings", async (_req, res) => {
    try {
      const recordings = await storage.getAllRecordings();
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recordings" });
    }
  });

  // Upload a new recording
  app.post("/api/recordings", upload.single("audio"), async (req, res) => {
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

      // Save to storage
      const recording = await storage.createRecording({
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
  app.delete("/api/recordings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRecording(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recording" });
    }
  });

  // Get all contracts
  app.get("/api/contracts", async (_req, res) => {
    try {
      const contracts = await storage.getAllContracts();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  // Create a new contract
  app.post("/api/contracts", async (req, res) => {
    try {
      const parsed = insertConsentContractSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid contract data" });
      }

      const contract = await storage.createContract(parsed.data);
      res.json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  // Delete a contract
  app.delete("/api/contracts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContract(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contract" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
