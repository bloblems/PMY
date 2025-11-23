/**
 * State Laws Routes
 * 
 * Public endpoints for state consent law reference data.
 */

import { Router } from "express";
import storage from "../storage";

const router = Router();

// Get all state laws
router.get("/", async (_req, res) => {
  try {
    const stateLaws = await storage.getAllStateLaws();
    res.json(stateLaws);
  } catch (error) {
    console.error("Error fetching state laws:", error);
    res.status(500).json({ error: "Failed to fetch state laws" });
  }
});

// Get a single state law by state code
router.get("/:stateCode", async (req, res) => {
  try {
    const { stateCode } = req.params;
    const stateLaw = await storage.getStateLaw(stateCode.toUpperCase());
    
    if (!stateLaw) {
      return res.status(404).json({ error: "State law not found" });
    }

    res.json(stateLaw);
  } catch (error) {
    console.error("Error fetching state law:", error);
    res.status(500).json({ error: "Failed to fetch state law" });
  }
});

export default router;
