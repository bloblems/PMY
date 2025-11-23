/**
 * Amendments Routes
 * 
 * Handles contract amendment lifecycle:
 * - Create amendment requests
 * - List amendments for a contract
 * - Approve/reject amendments
 */

import { Router } from "express";
import { requireAuth } from "../supabaseAuth";
import storage from "../storage";
import { insertContractAmendmentSchema } from "@shared/schema";
import { 
  notifyAmendmentRequest, 
  notifyAmendmentApproved, 
  notifyAmendmentRejected 
} from "./helpers/amendmentNotifications";

const router = Router();

// Create amendment request for a contract
router.post("/contract/:contractId", requireAuth, async (req, res) => {
  try {
    const { contractId: id } = req.params;
    const userId = req.user!.id;

    // Verify user has access to the contract
    const hasAccess = await storage.hasContractAccess(id, userId);
    if (!hasAccess) {
      return res.status(404).json({ error: "Contract not found" });
    }

    // Get the contract to verify status and amendment limit
    const contract = await storage.getContract(id, userId);
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    // Only active and paused contracts can be amended
    if (contract.status !== 'active' && contract.status !== 'paused') {
      return res.status(400).json({ error: "Only active or paused contracts can be amended" });
    }

    // Check amendment limit (max 2 approved amendments)
    const amendmentCount = await storage.getContractAmendmentCount(id);
    if (amendmentCount >= 2) {
      return res.status(400).json({ error: "Maximum of 2 amendments per contract reached" });
    }

    // Validate request body using zod schema
    const validation = insertContractAmendmentSchema.safeParse({
      contractId: id,
      requestedBy: userId,
      amendmentType: req.body.amendmentType,
      changes: req.body.changes,
      reason: req.body.reason,
      status: 'pending',
    });

    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid amendment data", 
        details: validation.error.errors 
      });
    }

    // Validate changes structure based on amendment type
    let parsedChanges;
    try {
      parsedChanges = JSON.parse(validation.data.changes);
    } catch (e) {
      return res.status(400).json({ error: "Invalid changes format" });
    }

    // Validate changes content based on type
    const amendmentType = validation.data.amendmentType;
    if (amendmentType === 'add_acts' || amendmentType === 'remove_acts') {
      const actsList = amendmentType === 'add_acts' ? parsedChanges.addedActs : parsedChanges.removedActs;
      if (!Array.isArray(actsList) || actsList.length === 0) {
        return res.status(400).json({ error: "At least one act must be specified" });
      }
      const validActs = ['touching', 'kissing', 'oral', 'anal', 'vaginal'];
      if (!actsList.every((act: string) => validActs.includes(act))) {
        return res.status(400).json({ error: "Invalid act specified" });
      }
    } else if (amendmentType === 'extend_duration' || amendmentType === 'shorten_duration') {
      if (!parsedChanges.newEndTime) {
        return res.status(400).json({ error: "New end time must be specified" });
      }
      const newEndTime = new Date(parsedChanges.newEndTime);
      if (isNaN(newEndTime.getTime())) {
        return res.status(400).json({ error: "Invalid end time format" });
      }
      if (newEndTime.getTime() < Date.now()) {
        return res.status(400).json({ error: "New end time cannot be in the past" });
      }
    }

    // Create the amendment
    const amendment = await storage.createContractAmendment(validation.data);

    // Send notifications to all contract participants except the requester
    if (req.user?.id && amendment?.id) {
      await notifyAmendmentRequest(contract, amendment.id, req.user.id, amendmentType);
    } else {
      console.error('Cannot send amendment request notification: missing user or amendment ID');
    }

    res.json({
      success: true,
      amendment,
      message: "Amendment request created. Waiting for approval from all parties."
    });
  } catch (error) {
    console.error("Error creating amendment:", error);
    res.status(500).json({ error: "Failed to create amendment request" });
  }
});

// Get all amendments for a contract
router.get("/contract/:contractId", requireAuth, async (req, res) => {
  try {
    const { contractId: id } = req.params;
    const userId = req.user!.id;

    // Verify user has access to the contract
    const hasAccess = await storage.hasContractAccess(id, userId);
    if (!hasAccess) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const amendments = await storage.getContractAmendments(id);
    res.json({ amendments });
  } catch (error) {
    console.error("Error fetching amendments:", error);
    res.status(500).json({ error: "Failed to fetch amendments" });
  }
});

// Approve an amendment
router.post("/:id/approve", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get the amendment to check the contract
    const amendment = await storage.getAmendment(id);
    if (!amendment) {
      return res.status(404).json({ error: "Amendment not found" });
    }

    // CRITICAL: Prevent self-approval - requester cannot approve their own amendment
    if (amendment.requestedBy === userId) {
      return res.status(403).json({ error: "You cannot approve your own amendment request" });
    }

    // Verify user has access to the contract
    const hasAccess = await storage.hasContractAccess(amendment.contractId, userId);
    if (!hasAccess) {
      return res.status(404).json({ error: "Amendment not found" });
    }

    // Approve the amendment
    const success = await storage.approveAmendment(id, userId);
    if (!success) {
      return res.status(400).json({ error: "Unable to approve amendment. It may have already been approved, rejected, or you may have already approved it." });
    }

    // Get updated amendment to check if all parties approved
    const updatedAmendment = await storage.getAmendment(id);
    const allApproved = updatedAmendment?.status === 'approved';

    // If all parties approved, notify the requester
    if (allApproved && amendment.requestedBy) {
      const contract = await storage.getContract(amendment.contractId, amendment.requestedBy);
      if (contract) {
        await notifyAmendmentApproved(contract, id, amendment.requestedBy);
      } else {
        console.error('Cannot send amendment approval notification: contract not found');
      }
    }

    res.json({
      success: true,
      message: allApproved 
        ? "All parties approved! Amendment has been applied to the contract." 
        : "Your approval recorded. Waiting for other parties.",
      allPartiesApproved: allApproved,
      amendment: updatedAmendment
    });
  } catch (error) {
    console.error("Error approving amendment:", error);
    res.status(500).json({ error: "Failed to approve amendment" });
  }
});

// Reject an amendment
router.post("/:id/reject", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    // Get the amendment to check the contract
    const amendment = await storage.getAmendment(id);
    if (!amendment) {
      return res.status(404).json({ error: "Amendment not found" });
    }

    // Verify user has access to the contract
    const hasAccess = await storage.hasContractAccess(amendment.contractId, userId);
    if (!hasAccess) {
      return res.status(404).json({ error: "Amendment not found" });
    }

    // Reject the amendment
    const success = await storage.rejectAmendment(id, userId, reason);
    if (!success) {
      return res.status(400).json({ error: "Unable to reject amendment. It may have already been approved or rejected." });
    }

    // Notify the requester that their amendment was rejected
    if (amendment.requestedBy && req.user?.id) {
      const contract = await storage.getContract(amendment.contractId, amendment.requestedBy);
      if (contract) {
        await notifyAmendmentRejected(contract, id, amendment.requestedBy, req.user.id, reason);
      } else {
        console.error('Cannot send amendment rejection notification: contract not found');
      }
    }

    res.json({
      success: true,
      message: "Amendment rejected successfully"
    });
  } catch (error) {
    console.error("Error rejecting amendment:", error);
    res.status(500).json({ error: "Failed to reject amendment" });
  }
});

export default router;
