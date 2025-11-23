/**
 * Amendment Notification Helpers
 * 
 * Shared notification logic for amendment lifecycle events:
 * - Amendment requested
 * - Amendment approved
 * - Amendment rejected
 */

import type { ConsentContract } from "@shared/schema";
import storage from "../../storage";
import { supabaseAdmin } from "../../supabase";
import { 
  sendAmendmentRequestEmail, 
  sendAmendmentApprovedEmail, 
  sendAmendmentRejectedEmail 
} from "../../email";

/**
 * Notify all contract participants (except requester) about a new amendment request
 */
export async function notifyAmendmentRequest(
  contract: ConsentContract | undefined,
  amendmentId: string,
  requestedBy: string,
  amendmentType: string
) {
  try {
    if (!contract || !contract.id) {
      console.error('Cannot send amendment request notification: contract is null/undefined or missing ID');
      return;
    }
    
    if (!requestedBy) {
      console.error('Cannot send amendment request notification: requestedBy is null/undefined');
      return;
    }

    // Get all contract participants: prefer collaborator records, fallback to parties array
    const allPartyIds = new Set<string>();
    
    // Try to get collaborators for this contract (collaborative contracts only)
    let collaborators: any[] = [];
    try {
      collaborators = await storage.getContractCollaborators(contract.id);
      if (collaborators.length === 0) {
        console.log('[Notifications] No collaborator records found, falling back to parties array');
      }
    } catch (error) {
      console.error('[Notifications] CRITICAL: Error fetching collaborators - falling back to parties array:', error);
      // Will fall back to parties array below
    }
    
    if (collaborators.length > 0) {
      // Collaborative contract: use collaborator records (canonical participant identity)
      for (const collaborator of collaborators) {
        if (collaborator.userId) {
          // PMY user - add to notification recipients
          allPartyIds.add(collaborator.userId);
        } else if (collaborator.legalName) {
          // External participant - cannot receive notifications
          console.log(`[Notifications] Skipping external participant "${collaborator.legalName}" - no PMY account`);
        }
      }
    } else {
      // Regular (non-collaborative) contract: use parties array as fallback
      // Note: This is backward compatible with older contracts without collaborator records
      if (contract.parties && Array.isArray(contract.parties)) {
        for (const partyIdentifier of contract.parties) {
          if (partyIdentifier && partyIdentifier.trim()) {
            // Normalize identifier: trim, remove annotations like "(Partner)", extract username
            let normalized = partyIdentifier.trim();
            
            // Strip annotations in parentheses (e.g., "@user_john (Partner)" -> "@user_john")
            normalized = normalized.replace(/\s*\(.*?\)\s*$/, '').trim();
            
            // Remove @ prefix if present
            let username = normalized.startsWith('@') ? normalized.substring(1) : normalized;
            
            // Normalize username: lowercase, trim again
            username = username.toLowerCase().trim();
            
            // Attempt to look up as PMY username (handles all formats: @username, user_xxx, bare legacy usernames)
            try {
              const profile = await storage.getUserByUsername(username);
              if (profile) {
                // PMY user found - add to notification recipients
                allPartyIds.add(profile.id);
              } else {
                // Username not found - likely an external participant (legal name)
                console.log(`[Notifications] Skipping "${partyIdentifier}" - no PMY account found`);
              }
            } catch (error) {
              console.error(`[Notifications] Error looking up ${partyIdentifier}:`, error);
            }
          }
        }
      }
    }
    
    // Ensure contract creator is always notified
    if (contract.userId) {
      allPartyIds.add(contract.userId);
    }
    // Legacy fallback: if no userId set, try to extract first PMY username from parties as initiator
    if (!contract.userId && contract.parties && contract.parties.length > 0) {
      const firstParty = contract.parties[0];
      if (firstParty && firstParty.trim()) {
        let normalized = firstParty.trim().replace(/\s*\(.*?\)\s*$/, '').trim();
        let username = normalized.startsWith('@') ? normalized.substring(1) : normalized;
        username = username.toLowerCase().trim();
        try {
          const profile = await storage.getUserByUsername(username);
          if (profile) {
            allPartyIds.add(profile.id);
            console.log(`[Notifications] Added legacy contract initiator from parties[0]: ${firstParty}`);
          }
        } catch (error) {
          console.error(`[Notifications] Error looking up legacy initiator ${firstParty}:`, error);
        }
      }
    }
    
    // Filter out the requester to get recipients
    const recipientIds = Array.from(allPartyIds).filter(partyId => partyId !== requestedBy);

    if (recipientIds.length === 0) {
      console.log('No recipients for amendment notification (requester is sole party)');
      return;
    }

    // Create appropriate label and message based on amendment type
    let amendmentTypeLabel: string;
    let actionMessage: string;
    
    switch (amendmentType) {
      case 'add_acts':
        amendmentTypeLabel = 'Add Acts';
        actionMessage = 'add intimate acts to';
        break;
      case 'remove_acts':
        amendmentTypeLabel = 'Remove Acts';
        actionMessage = 'remove intimate acts from';
        break;
      case 'extend_duration':
        amendmentTypeLabel = 'Extend Duration';
        actionMessage = 'extend the duration of';
        break;
      case 'shorten_duration':
        amendmentTypeLabel = 'Shorten Duration';
        actionMessage = 'shorten the duration of';
        break;
      default:
        amendmentTypeLabel = 'Modify';
        actionMessage = 'modify';
    }
    
    // Get requester's profile for name
    const requesterProfile = await storage.getUserProfile(requestedBy);
    const requesterName = requesterProfile?.username || 'A partner';
    
    for (const userId of recipientIds) {
      // Create in-app notification
      await storage.createNotification({
        userId,
        type: 'amendment_requested',
        title: `Amendment Request: ${amendmentTypeLabel}`,
        message: `A partner has requested to ${actionMessage} your consent contract`,
        relatedContractId: contract.id,
        relatedAmendmentId: amendmentId,
        isRead: 'false',
      });
      
      // Send email if user has email notifications enabled
      try {
        const recipientProfile = await storage.getUserProfile(userId);
        if (recipientProfile?.emailNotificationsEnabled === 'true') {
          // Get user email from Supabase Auth
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (userData?.user?.email) {
            const recipientName = recipientProfile.username || 'User';
            // Fetch amendment to get reason
            const amendment = await storage.getAmendment(amendmentId);
            const reason = amendment?.reason || 'No reason provided';
            
            await sendAmendmentRequestEmail({
              to: userData.user.email,
              recipientName,
              requesterName,
              amendmentType: amendmentTypeLabel,
              reason
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send amendment request email:', emailError);
        // Don't block notification if email fails
      }
    }
  } catch (error) {
    console.error('Error creating amendment request notifications:', error);
    // Don't block the main request if notification fails
  }
}

/**
 * Notify requester that their amendment was approved by all parties
 */
export async function notifyAmendmentApproved(
  contract: ConsentContract | undefined,
  amendmentId: string,
  requestedBy: string,
  approvedBy?: string
) {
  try {
    if (!contract || !contract.id) {
      console.error('Cannot send amendment approval notification: contract is null/undefined or missing ID');
      return;
    }
    
    if (!requestedBy) {
      console.error('Cannot send amendment approval notification: requestedBy is null/undefined');
      return;
    }

    // Create in-app notification
    await storage.createNotification({
      userId: requestedBy,
      type: 'amendment_approved',
      title: 'Amendment Approved',
      message: 'All parties have approved your amendment request',
      relatedContractId: contract.id,
      relatedAmendmentId: amendmentId,
      isRead: 'false',
    });
    
    // Send email if user has email notifications enabled
    try {
      const requesterProfile = await storage.getUserProfile(requestedBy);
      if (requesterProfile?.emailNotificationsEnabled === 'true') {
        // Get user email from Supabase Auth
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(requestedBy);
        if (userData?.user?.email) {
          const recipientName = requesterProfile.username || 'User';
          
          // Get approver name
          let approverName = 'A partner';
          if (approvedBy) {
            const approverProfile = await storage.getUserProfile(approvedBy);
            approverName = approverProfile?.username || 'A partner';
          }
          
          // Fetch amendment to get type
          const amendment = await storage.getAmendment(amendmentId);
          let amendmentTypeLabel = 'Modify';
          if (amendment) {
            switch (amendment.amendmentType) {
              case 'add_acts':
                amendmentTypeLabel = 'Add Acts';
                break;
              case 'remove_acts':
                amendmentTypeLabel = 'Remove Acts';
                break;
              case 'extend_duration':
                amendmentTypeLabel = 'Extend Duration';
                break;
              case 'shorten_duration':
                amendmentTypeLabel = 'Shorten Duration';
                break;
            }
          }
          
          await sendAmendmentApprovedEmail({
            to: userData.user.email,
            recipientName,
            approverName,
            amendmentType: amendmentTypeLabel
          });
        }
      }
    } catch (emailError) {
      console.error('Failed to send amendment approval email:', emailError);
      // Don't block notification if email fails
    }
  } catch (error) {
    console.error('Error creating amendment approval notification:', error);
    // Don't block the main request if notification fails
  }
}

/**
 * Notify requester that their amendment was rejected
 */
export async function notifyAmendmentRejected(
  contract: ConsentContract | undefined,
  amendmentId: string,
  requestedBy: string,
  rejectedBy: string,
  reason?: string
) {
  try {
    if (!contract || !contract.id) {
      console.error('Cannot send amendment rejection notification: contract is null/undefined or missing ID');
      return;
    }
    
    if (!requestedBy) {
      console.error('Cannot send amendment rejection notification: requestedBy is null/undefined');
      return;
    }

    // Get the rejector's profile to include their name if available
    let rejectorName = 'A partner';
    if (rejectedBy) {
      try {
        const rejectorProfile = await storage.getUserProfile(rejectedBy);
        if (rejectorProfile && rejectorProfile.username) {
          rejectorName = rejectorProfile.username;
        }
      } catch (e) {
        // Fall back to generic message if we can't get the rejector's profile
        console.log('Could not fetch rejector profile:', e);
      }
    }

    // Build message with rejector info and optional rejection reason
    let message = `${rejectorName} has rejected your amendment request`;
    if (reason && reason.trim()) {
      message += `. Reason: ${reason}`;
    }

    // Create in-app notification
    await storage.createNotification({
      userId: requestedBy,
      type: 'amendment_rejected',
      title: 'Amendment Rejected',
      message,
      relatedContractId: contract.id,
      relatedAmendmentId: amendmentId,
      isRead: 'false',
    });
    
    // Send email if user has email notifications enabled
    try {
      const requesterProfile = await storage.getUserProfile(requestedBy);
      if (requesterProfile?.emailNotificationsEnabled === 'true') {
        // Get user email from Supabase Auth
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(requestedBy);
        if (userData?.user?.email) {
          const recipientName = requesterProfile.username || 'User';
          
          // Fetch amendment to get type
          const amendment = await storage.getAmendment(amendmentId);
          let amendmentTypeLabel = 'Modify';
          if (amendment) {
            switch (amendment.amendmentType) {
              case 'add_acts':
                amendmentTypeLabel = 'Add Acts';
                break;
              case 'remove_acts':
                amendmentTypeLabel = 'Remove Acts';
                break;
              case 'extend_duration':
                amendmentTypeLabel = 'Extend Duration';
                break;
              case 'shorten_duration':
                amendmentTypeLabel = 'Shorten Duration';
                break;
            }
          }
          
          await sendAmendmentRejectedEmail({
            to: userData.user.email,
            recipientName,
            rejectorName,
            amendmentType: amendmentTypeLabel,
            rejectionReason: reason
          });
        }
      }
    } catch (emailError) {
      console.error('Failed to send amendment rejection email:', emailError);
      // Don't block notification if email fails
    }
  } catch (error) {
    console.error('Error creating amendment rejection notification:', error);
    // Don't block the main request if notification fails
  }
}
