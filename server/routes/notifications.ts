/**
 * Notifications Routes
 * 
 * Handles in-app notification delivery, read status, and unread counts.
 */

import { Router } from "express";
import { requireAuth } from "../supabaseAuth";
import storage from "../storage";

const router = Router();

// Get user's notifications (paginated)
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const notifications = await storage.getUserNotifications(userId, limit);
    res.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread notification count
router.get("/unread/count", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const count = await storage.getUnreadNotificationCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// Mark specific notification as read
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const success = await storage.markNotificationAsRead(id, userId);
    if (!success) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    await storage.markAllNotificationsAsRead(userId);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

export default router;
