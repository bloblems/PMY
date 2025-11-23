/**
 * Universities Routes
 * 
 * Public endpoints for university reference data.
 */

import { Router } from "express";
import storage from "../storage";

const router = Router();

// Get all universities
router.get("/", async (_req, res) => {
  try {
    const universities = await storage.getAllUniversities();
    res.json(universities);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch universities" });
  }
});

// Get a single university by ID
router.get("/:id", async (req, res) => {
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

export default router;
