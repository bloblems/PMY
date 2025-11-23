/**
 * Unified Messaging Service
 * 
 * Orchestrates email and in-app notification delivery with typed payloads,
 * structured error handling, and centralized participant lookup.
 */

import { Resend } from 'resend';
import { EmailTemplates } from './email-templates';
import type { IStorage } from './storage';

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================================
// Result Types for Error Handling
// ============================================================================

export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<T>(error: string, details?: unknown): Result<T> {
  return { success: false, error, details };
}

export interface MessageResult {
  emailSent: boolean;
  emailError?: string;
  notificationCreated: boolean;
  notificationError?: string;
}

// ============================================================================
// Message Payload Types (Discriminated Unions)
// ============================================================================

export type MessagePayload =
  | InvitationMessagePayload
  | DocumentShareMessagePayload
  | WelcomeMessagePayload
  | PasswordResetMessagePayload
  | PasswordResetConfirmationMessagePayload
  | AmendmentRequestMessagePayload
  | AmendmentApprovedMessagePayload
  | AmendmentRejectedMessagePayload;

export interface InvitationMessagePayload {
  type: 'invitation';
  to: string;
  referrerName: string;
  referralCode: string;
  personalMessage?: string;
}

export interface DocumentShareMessagePayload {
  type: 'document_share';
  to: string;
  from: string;
  documentType: string;
  documentDate: string;
  pdfAttachment?: {
    filename: string;
    content: Buffer;
  };
}

export interface WelcomeMessagePayload {
  type: 'welcome';
  to: string;
  name: string;
}

export interface PasswordResetMessagePayload {
  type: 'password_reset';
  to: string;
  name: string;
  resetToken: string;
}

export interface PasswordResetConfirmationMessagePayload {
  type: 'password_reset_confirmation';
  to: string;
  name: string;
}

export interface AmendmentRequestMessagePayload {
  type: 'amendment_request';
  to: string;
  recipientUserId?: string; // For in-app notification
  recipientName: string;
  requesterName: string;
  amendmentType: string;
  reason: string;
  contractId?: string; // For in-app notification link
  amendmentId?: string; // For in-app notification link
}

export interface AmendmentApprovedMessagePayload {
  type: 'amendment_approved';
  to: string;
  recipientUserId?: string; // For in-app notification
  recipientName: string;
  approverName: string;
  amendmentType: string;
  contractId?: string; // For in-app notification link
  amendmentId?: string; // For in-app notification link
}

export interface AmendmentRejectedMessagePayload {
  type: 'amendment_rejected';
  to: string;
  recipientUserId?: string; // For in-app notification
  recipientName: string;
  rejectorName: string;
  amendmentType: string;
  rejectionReason?: string;
  contractId?: string; // For in-app notification link
  amendmentId?: string; // For in-app notification link
}

// ============================================================================
// Messaging Service
// ============================================================================

export class MessagingService {
  constructor(private storage: IStorage) {}

  /**
   * Send a message via email and optionally create an in-app notification
   * Returns a MessageResult with success/failure for each channel
   */
  async sendMessage(payload: MessagePayload): Promise<Result<MessageResult>> {
    const result: MessageResult = {
      emailSent: false,
      notificationCreated: false,
    };

    // Send email
    try {
      const emailResult = await this.sendEmail(payload);
      if (emailResult.success) {
        result.emailSent = true;
      } else {
        result.emailError = emailResult.error;
      }
    } catch (error) {
      result.emailError = error instanceof Error ? error.message : 'Unknown email error';
      console.error('[MessagingService] Email sending failed:', error);
    }

    // Create in-app notification (only for certain message types with userId)
    if (this.supportsInAppNotification(payload)) {
      try {
        const notificationResult = await this.createInAppNotification(payload);
        if (notificationResult.success) {
          result.notificationCreated = true;
        } else {
          result.notificationError = notificationResult.error;
        }
      } catch (error) {
        result.notificationError = error instanceof Error ? error.message : 'Unknown notification error';
        console.error('[MessagingService] Notification creation failed:', error);
      }
    }

    return ok(result);
  }

  /**
   * Check if user has email notifications enabled
   */
  private async shouldSendEmail(userId: string | undefined): Promise<boolean> {
    if (!userId) return true; // Always send to external participants
    
    try {
      const profile = await this.storage.getUserProfile(userId);
      return profile?.emailNotificationsEnabled === 'true';
    } catch (error) {
      console.error('[MessagingService] Failed to check email preferences:', error);
      return true; // Default to sending on error
    }
  }

  /**
   * Send email based on message payload type
   */
  private async sendEmail(payload: MessagePayload): Promise<Result<void>> {
    try {
      // Check email preferences for messages with userId
      if ('recipientUserId' in payload && payload.recipientUserId) {
        const shouldSend = await this.shouldSendEmail(payload.recipientUserId);
        if (!shouldSend) {
          return ok(undefined); // User opted out, not an error
        }
      }

      switch (payload.type) {
        case 'invitation':
          await this.sendInvitationEmail(payload);
          break;
        case 'document_share':
          await this.sendDocumentShareEmail(payload);
          break;
        case 'welcome':
          await this.sendWelcomeEmail(payload);
          break;
        case 'password_reset':
          await this.sendPasswordResetEmail(payload);
          break;
        case 'password_reset_confirmation':
          await this.sendPasswordResetConfirmationEmail(payload);
          break;
        case 'amendment_request':
          await this.sendAmendmentRequestEmail(payload);
          break;
        case 'amendment_approved':
          await this.sendAmendmentApprovedEmail(payload);
          break;
        case 'amendment_rejected':
          await this.sendAmendmentRejectedEmail(payload);
          break;
        default:
          const _exhaustive: never = payload;
          return err(`Unknown message type: ${(_exhaustive as any).type}`);
      }

      return ok(undefined);
    } catch (error) {
      return err('Failed to send email', error);
    }
  }

  /**
   * Create in-app notification based on message payload type
   */
  private async createInAppNotification(
    payload: AmendmentRequestMessagePayload | AmendmentApprovedMessagePayload | AmendmentRejectedMessagePayload
  ): Promise<Result<void>> {
    if (!payload.recipientUserId) {
      return ok(undefined); // External participant, no in-app notification
    }

    try {
      let title: string;
      let message: string;
      let type: 'amendment_requested' | 'amendment_approved' | 'amendment_rejected';

      switch (payload.type) {
        case 'amendment_request':
          title = 'Amendment Request';
          message = `${payload.requesterName} requested an amendment: ${payload.amendmentType}`;
          type = 'amendment_requested';
          break;
        case 'amendment_approved':
          title = 'Amendment Approved';
          message = `${payload.approverName} approved your amendment: ${payload.amendmentType}`;
          type = 'amendment_approved';
          break;
        case 'amendment_rejected':
          title = 'Amendment Rejected';
          message = `${payload.rejectorName} rejected your amendment: ${payload.amendmentType}`;
          type = 'amendment_rejected';
          break;
        default:
          return ok(undefined); // Not a notification type
      }

      await this.storage.createNotification({
        userId: payload.recipientUserId,
        type,
        title,
        message,
        isRead: 'false',
        relatedContractId: payload.contractId,
        relatedAmendmentId: payload.amendmentId,
      });

      return ok(undefined);
    } catch (error) {
      return err('Failed to create notification', error);
    }
  }

  /**
   * Check if message type supports in-app notifications
   */
  private supportsInAppNotification(payload: MessagePayload): payload is 
    AmendmentRequestMessagePayload | AmendmentApprovedMessagePayload | AmendmentRejectedMessagePayload {
    return payload.type === 'amendment_request' 
      || payload.type === 'amendment_approved' 
      || payload.type === 'amendment_rejected';
  }

  // ============================================================================
  // Email Template Implementations (using new template system)
  // ============================================================================

  private async sendInvitationEmail(payload: InvitationMessagePayload): Promise<void> {
    const referralLink = `${EmailTemplates.appUrl}/?ref=${payload.referralCode}`;
    
    const bodyHtml = `
      <p>${payload.referrerName} has invited you to join PMY, a secure platform for Title IX-compliant consent documentation.</p>
      
      ${payload.personalMessage ? EmailTemplates.components.infoBox({
        type: 'neutral',
        content: `"${payload.personalMessage}" — ${payload.referrerName}`,
      }) : ''}
      
      ${EmailTemplates.components.ctaButton({
        text: 'Join PMY Now',
        url: referralLink,
      })}
      
      <div style="background: ${EmailTemplates.colors.gray50}; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; font-size: 16px; color: ${EmailTemplates.colors.primary};">What is PMY?</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: ${EmailTemplates.colors.gray800};">
          <li>Secure consent documentation with 4 methods: signatures, audio, photos, and biometric</li>
          <li>Title IX-compliant for college students</li>
          <li>University-specific policy guidance</li>
          <li>Private, encrypted, and legally sound</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: ${EmailTemplates.colors.gray400}; border-top: 1px solid ${EmailTemplates.colors.gray200}; padding-top: 20px; margin-top: 30px;">
        Your referral code: <strong>${payload.referralCode}</strong><br>
        <a href="${referralLink}" style="color: ${EmailTemplates.colors.primary}; text-decoration: none;">${referralLink}</a>
      </p>
    `;

    const bodyText = `
${payload.referrerName} has invited you to join PMY, a secure platform for Title IX-compliant consent documentation.

${payload.personalMessage ? `Personal message from ${payload.referrerName}:\n"${payload.personalMessage}"\n\n` : ''}

Join PMY: ${referralLink}

What is PMY?
• Secure consent documentation with 4 methods: signatures, audio, photos, and biometric
• Title IX-compliant for college students
• University-specific policy guidance
• Private, encrypted, and legally sound

Your referral code: ${payload.referralCode}
    `.trim();

    const { htmlContent, textContent } = EmailTemplates.build({
      theme: 'primary',
      headerTitle: EmailTemplates.brandName,
      headerSubtitle: 'Title IX Consent Documentation',
      greeting: "You've been invited to join PMY!",
      bodyHtml,
      bodyText,
      footerText: `This invitation was sent by ${payload.referrerName}`,
    });

    await resend.emails.send({
      from: 'PMY Invitations <invitations@updates.pmy.app>',
      to: payload.to,
      subject: `${payload.referrerName} invited you to join PMY`,
      html: htmlContent,
      text: textContent,
    });
  }

  private async sendDocumentShareEmail(payload: DocumentShareMessagePayload): Promise<void> {
    const bodyHtml = `
      <p>A PMY user has shared a consent document with you.</p>
      
      ${EmailTemplates.components.detailCard({
        items: [
          { label: 'Document Type', value: payload.documentType },
          { label: 'Date', value: payload.documentDate },
          { label: 'Shared By', value: payload.from },
        ],
      })}
      
      ${payload.pdfAttachment 
        ? EmailTemplates.components.infoBox({
            type: 'success',
            content: `<strong>Attachment:</strong> ${payload.pdfAttachment.filename}`,
          })
        : '<p style="color: #555;">The document details are included in this email for your records.</p>'
      }
      
      ${EmailTemplates.components.infoBox({
        type: 'warning',
        title: 'Important',
        content: 'This is a legal consent document. Please store it securely and do not share it with unauthorized parties.',
      })}
      
      ${EmailTemplates.components.joinPMYInvite({ context: 'document' })}
    `;

    const bodyText = `
A PMY user has shared a consent document with you.

Document Type: ${payload.documentType}
Date: ${payload.documentDate}
Shared By: ${payload.from}

${payload.pdfAttachment ? `Attachment: ${payload.pdfAttachment.filename}` : 'The document details are included in this email for your records.'}

IMPORTANT: This is a legal consent document. Please store it securely and do not share it with unauthorized parties.
    `.trim();

    const { htmlContent, textContent } = EmailTemplates.build({
      theme: 'primary',
      headerTitle: EmailTemplates.brandName,
      headerSubtitle: 'Consent Document Delivery',
      greeting: 'Consent Document Shared',
      bodyHtml,
      bodyText,
    });

    const emailData: any = {
      from: 'PMY Documents <documents@updates.pmy.app>',
      to: payload.to,
      subject: `Consent Document from ${payload.from}`,
      html: htmlContent,
      text: textContent,
    };

    if (payload.pdfAttachment) {
      emailData.attachments = [{
        filename: payload.pdfAttachment.filename,
        content: payload.pdfAttachment.content,
      }];
    }

    await resend.emails.send(emailData);
  }

  private async sendWelcomeEmail(payload: WelcomeMessagePayload): Promise<void> {
    const bodyHtml = `
      <p>Your PMY account is now active and ready to use. You can start documenting consent using any of our four secure methods:</p>
      
      <div style="background: ${EmailTemplates.colors.gray50}; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="margin-top: 0; font-size: 16px; color: ${EmailTemplates.colors.success};">Four Documentation Methods</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: ${EmailTemplates.colors.gray800};">
          <li><strong>Digital Signatures:</strong> Sign consent contracts digitally</li>
          <li><strong>Audio Recording:</strong> Record verbal consent agreements</li>
          <li><strong>Photo Capture:</strong> Document consent with dual selfies</li>
          <li><strong>Biometric Auth:</strong> Use Touch ID, Face ID, or Windows Hello</li>
        </ul>
      </div>
      
      ${EmailTemplates.components.ctaButton({
        theme: 'success',
        text: 'Start Documenting Consent',
        url: EmailTemplates.appUrl,
      })}
      
      ${EmailTemplates.components.infoBox({
        type: 'success',
        content: '<strong>Pro Tip:</strong> Set your default university and state in Profile → Preferences to speed up consent creation.',
      })}
    `;

    const bodyText = `
Your PMY account is now active and ready to use. You can start documenting consent using any of our four secure methods:

Four Documentation Methods:
• Digital Signatures: Sign consent contracts digitally
• Audio Recording: Record verbal consent agreements
• Photo Capture: Document consent with dual selfies
• Biometric Auth: Use Touch ID, Face ID, or Windows Hello

Pro Tip: Set your default university and state in Profile → Preferences to speed up consent creation.
    `.trim();

    const { htmlContent, textContent } = EmailTemplates.build({
      theme: 'success',
      headerTitle: 'Welcome to PMY!',
      headerSubtitle: 'Secure Title IX Consent Documentation',
      greeting: `Hi ${payload.name}, thanks for joining!`,
      bodyHtml,
      bodyText,
    });

    await resend.emails.send({
      from: 'PMY <welcome@updates.pmy.app>',
      to: payload.to,
      subject: `Welcome to PMY, ${payload.name}!`,
      html: htmlContent,
      text: textContent,
    });
  }

  private async sendPasswordResetEmail(payload: PasswordResetMessagePayload): Promise<void> {
    const resetUrl = `${EmailTemplates.appUrl}/reset-password?token=${payload.resetToken}`;

    const bodyHtml = `
      <p>We received a request to reset the password for your PMY account. Click the button below to create a new password:</p>
      
      ${EmailTemplates.components.ctaButton({
        text: 'Reset Your Password',
        url: resetUrl,
      })}
      
      <p style="font-size: 14px; color: ${EmailTemplates.colors.gray500};">Or copy and paste this link into your browser:</p>
      <p style="font-size: 13px; color: ${EmailTemplates.colors.primary}; word-break: break-all; background: ${EmailTemplates.colors.gray50}; padding: 10px; border-radius: 4px;">
        ${resetUrl}
      </p>
      
      ${EmailTemplates.components.infoBox({
        type: 'warning',
        title: 'Security Note',
        content: "This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.",
      })}
      
      <p style="font-size: 14px; color: ${EmailTemplates.colors.gray400}; border-top: 1px solid ${EmailTemplates.colors.gray200}; padding-top: 20px; margin-top: 30px;">
        For security reasons, we cannot reset your password for you. Only you can reset it using the link above.
      </p>
    `;

    const bodyText = `
We received a request to reset the password for your PMY account. Use the link below to create a new password:

${resetUrl}

Security Note: This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.

For security reasons, we cannot reset your password for you. Only you can reset it using the link above.
    `.trim();

    const { htmlContent, textContent } = EmailTemplates.build({
      theme: 'primary',
      headerTitle: 'Password Reset Request',
      headerSubtitle: 'PMY Account Security',
      greeting: `Hi ${payload.name},`,
      bodyHtml,
      bodyText,
    });

    await resend.emails.send({
      from: 'PMY Security <security@updates.pmy.app>',
      to: payload.to,
      subject: 'Reset Your PMY Password',
      html: htmlContent,
      text: textContent,
    });
  }

  private async sendPasswordResetConfirmationEmail(payload: PasswordResetConfirmationMessagePayload): Promise<void> {
    const bodyHtml = `
      <p>Your PMY password has been successfully reset. You can now sign in with your new password.</p>
      
      ${EmailTemplates.components.ctaButton({
        theme: 'success',
        text: 'Sign In to PMY',
        url: `${EmailTemplates.appUrl}/auth`,
      })}
      
      ${EmailTemplates.components.infoBox({
        type: 'success',
        content: '<strong>Your account is secure.</strong> All active sessions have been logged out for your protection.',
      })}
      
      ${EmailTemplates.components.infoBox({
        type: 'warning',
        title: "Didn't reset your password?",
        content: "If you didn't make this change, contact our support team immediately as your account may be compromised.",
      })}
      
      <p style="font-size: 14px; color: ${EmailTemplates.colors.gray400}; border-top: 1px solid ${EmailTemplates.colors.gray200}; padding-top: 20px; margin-top: 30px;">
        Need help? Visit our help center or reply to this email.
      </p>
    `;

    const bodyText = `
Your PMY password has been successfully reset. You can now sign in with your new password.

Your account is secure. All active sessions have been logged out for your protection.

Didn't reset your password? If you didn't make this change, contact our support team immediately as your account may be compromised.

Need help? Visit our help center or reply to this email.
    `.trim();

    const { htmlContent, textContent } = EmailTemplates.build({
      theme: 'success',
      headerTitle: 'Password Reset Successful',
      headerSubtitle: 'Your PMY Account is Secure',
      greeting: `Hi ${payload.name},`,
      bodyHtml,
      bodyText,
    });

    await resend.emails.send({
      from: 'PMY Security <security@updates.pmy.app>',
      to: payload.to,
      subject: 'Your PMY Password Has Been Reset',
      html: htmlContent,
      text: textContent,
    });
  }

  private async sendAmendmentRequestEmail(payload: AmendmentRequestMessagePayload): Promise<void> {
    const bodyHtml = `
      <p>${payload.requesterName} has requested an amendment to your consent contract.</p>
      
      ${EmailTemplates.components.detailCard({
        items: [
          { label: 'Amendment Type', value: payload.amendmentType },
          { label: 'Requested By', value: payload.requesterName },
        ],
      })}
      
      ${EmailTemplates.components.infoBox({
        type: 'info',
        title: 'Reason',
        content: `"${payload.reason}"`,
      })}
      
      ${EmailTemplates.components.ctaButton({
        theme: 'info',
        text: 'Review Amendment Request',
        url: `${EmailTemplates.appUrl}/files`,
      })}
      
      ${EmailTemplates.components.infoBox({
        type: 'warning',
        content: '<strong>Action Required:</strong> Please review and respond to this amendment request. You can approve or reject changes to your consent contract.',
      })}
    `;

    const bodyText = `
${payload.requesterName} has requested an amendment to your consent contract.

Amendment Type: ${payload.amendmentType}
Requested By: ${payload.requesterName}
Reason: "${payload.reason}"

Action Required: Please review and respond to this amendment request. You can approve or reject changes to your consent contract.
    `.trim();

    const { htmlContent, textContent } = EmailTemplates.build({
      theme: 'info',
      headerTitle: 'Amendment Request',
      headerSubtitle: 'PMY Consent Documentation',
      greeting: `Hi ${payload.recipientName},`,
      bodyHtml,
      bodyText,
    });

    await resend.emails.send({
      from: 'PMY Notifications <notifications@updates.pmy.app>',
      to: payload.to,
      subject: `Amendment Request from ${payload.requesterName}`,
      html: htmlContent,
      text: textContent,
    });
  }

  private async sendAmendmentApprovedEmail(payload: AmendmentApprovedMessagePayload): Promise<void> {
    const bodyHtml = `
      <p>Good news! ${payload.approverName} has approved your amendment request.</p>
      
      ${EmailTemplates.components.detailCard({
        items: [
          { label: 'Amendment Type', value: payload.amendmentType },
          { label: 'Approved By', value: payload.approverName },
        ],
      })}
      
      ${EmailTemplates.components.infoBox({
        type: 'success',
        content: '<strong>Amendment Approved:</strong> Your consent contract has been updated with the approved changes.',
      })}
      
      ${EmailTemplates.components.ctaButton({
        theme: 'success',
        text: 'View Updated Contract',
        url: `${EmailTemplates.appUrl}/files`,
      })}
      
      <p style="font-size: 14px; color: ${EmailTemplates.colors.gray400}; border-top: 1px solid ${EmailTemplates.colors.gray200}; padding-top: 20px; margin-top: 30px;">
        You can view your updated contract in the Active Contracts section of your PMY dashboard.
      </p>
    `;

    const bodyText = `
Good news! ${payload.approverName} has approved your amendment request.

Amendment Type: ${payload.amendmentType}
Approved By: ${payload.approverName}

Amendment Approved: Your consent contract has been updated with the approved changes.

You can view your updated contract in the Active Contracts section of your PMY dashboard.
    `.trim();

    const { htmlContent, textContent } = EmailTemplates.build({
      theme: 'success',
      headerTitle: 'Amendment Approved',
      headerSubtitle: 'PMY Consent Documentation',
      greeting: `Hi ${payload.recipientName},`,
      bodyHtml,
      bodyText,
    });

    await resend.emails.send({
      from: 'PMY Notifications <notifications@updates.pmy.app>',
      to: payload.to,
      subject: `Amendment Approved by ${payload.approverName}`,
      html: htmlContent,
      text: textContent,
    });
  }

  private async sendAmendmentRejectedEmail(payload: AmendmentRejectedMessagePayload): Promise<void> {
    const bodyHtml = `
      <p>${payload.rejectorName} has rejected your amendment request.</p>
      
      ${EmailTemplates.components.detailCard({
        items: [
          { label: 'Amendment Type', value: payload.amendmentType },
          { label: 'Rejected By', value: payload.rejectorName },
        ],
      })}
      
      ${payload.rejectionReason ? EmailTemplates.components.infoBox({
        type: 'danger',
        title: 'Rejection Reason',
        content: `"${payload.rejectionReason}"`,
      }) : ''}
      
      ${EmailTemplates.components.infoBox({
        type: 'warning',
        content: '<strong>ℹ️ Next Steps:</strong> Your original consent contract remains unchanged. You can discuss this with your partner and submit a new amendment request if needed.',
      })}
      
      ${EmailTemplates.components.ctaButton({
        theme: 'danger',
        text: 'View Contract',
        url: `${EmailTemplates.appUrl}/files`,
      })}
    `;

    const bodyText = `
${payload.rejectorName} has rejected your amendment request.

Amendment Type: ${payload.amendmentType}
Rejected By: ${payload.rejectorName}
${payload.rejectionReason ? `Rejection Reason: "${payload.rejectionReason}"` : ''}

Next Steps: Your original consent contract remains unchanged. You can discuss this with your partner and submit a new amendment request if needed.
    `.trim();

    const { htmlContent, textContent } = EmailTemplates.build({
      theme: 'danger',
      headerTitle: 'Amendment Rejected',
      headerSubtitle: 'PMY Consent Documentation',
      greeting: `Hi ${payload.recipientName},`,
      bodyHtml,
      bodyText,
    });

    await resend.emails.send({
      from: 'PMY Notifications <notifications@updates.pmy.app>',
      to: payload.to,
      subject: `Amendment Rejected by ${payload.rejectorName}`,
      html: htmlContent,
      text: textContent,
    });
  }
}
