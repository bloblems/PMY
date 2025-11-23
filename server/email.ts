import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInvitationEmailParams {
  to: string;
  referrerName: string;
  referralCode: string;
  personalMessage?: string;
}

interface SendDocumentEmailParams {
  to: string;
  from: string;
  documentType: string;
  documentDate: string;
  pdfAttachment?: {
    filename: string;
    content: Buffer;
  };
}

interface SendWelcomeEmailParams {
  to: string;
  name: string;
}

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetToken: string;
}

interface SendPasswordResetConfirmationParams {
  to: string;
  name: string;
}

/**
 * Send referral invitation email via Resend
 */
export async function sendInvitationEmail({
  to,
  referrerName,
  referralCode,
  personalMessage
}: SendInvitationEmailParams) {
  const referralLink = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://pmy.app'}/?ref=${referralCode}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're invited to PMY</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">PMY</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Title IX Consent Documentation</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">You've been invited to join PMY!</h2>
        
        <p>${referrerName} has invited you to join PMY, a secure platform for Title IX-compliant consent documentation.</p>
        
        ${personalMessage ? `
          <div style="background: #f7f7f7; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-style: italic; color: #555;">"${personalMessage}"</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #888;">— ${referrerName}</p>
          </div>
        ` : ''}
        
        <div style="margin: 30px 0;">
          <a href="${referralLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Join PMY Now
          </a>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 16px; color: #667eea;">What is PMY?</h3>
          <ul style="margin: 10px 0; padding-left: 20px; color: #555;">
            <li>Secure consent documentation with 4 methods: signatures, audio, photos, and biometric</li>
            <li>Title IX-compliant for college students</li>
            <li>University-specific policy guidance</li>
            <li>Private, encrypted, and legally sound</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #888; border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
          Your referral code: <strong>${referralCode}</strong><br>
          <a href="${referralLink}" style="color: #667eea; text-decoration: none;">${referralLink}</a>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>PMY - Secure Title IX Consent Documentation</p>
        <p>This invitation was sent by ${referrerName}</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
You've been invited to join PMY!

${referrerName} has invited you to join PMY, a secure platform for Title IX-compliant consent documentation.

${personalMessage ? `Personal message from ${referrerName}:\n"${personalMessage}"\n\n` : ''}

Join PMY: ${referralLink}

What is PMY?
• Secure consent documentation with 4 methods: signatures, audio, photos, and biometric
• Title IX-compliant for college students
• University-specific policy guidance
• Private, encrypted, and legally sound

Your referral code: ${referralCode}
  `.trim();

  const result = await resend.emails.send({
    from: 'PMY Invitations <invitations@updates.pmy.app>',
    to,
    subject: `${referrerName} invited you to join PMY`,
    html: htmlContent,
    text: textContent,
  });

  return result;
}

/**
 * Send consent document via email
 */
export async function sendDocumentEmail({
  to,
  from,
  documentType,
  documentDate,
  pdfAttachment
}: SendDocumentEmailParams) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your PMY Consent Document</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">PMY</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Consent Document Delivery</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Consent Document Shared</h2>
        
        <p>A PMY user has shared a consent document with you.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Document Type:</strong> ${documentType}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${documentDate}</p>
          <p style="margin: 5px 0;"><strong>Shared By:</strong> ${from}</p>
        </div>
        
        ${pdfAttachment ? `
          <div style="background: #e8f5e9; border: 1px solid #4caf50; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #2e7d32;">
              <strong>Attachment:</strong> ${pdfAttachment.filename}
            </p>
          </div>
        ` : `
          <p style="color: #555;">The document details are included in this email for your records.</p>
        `}
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Important:</strong> This is a legal consent document. Please store it securely and do not share it with unauthorized parties.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #888; border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
          This document was sent via PMY's secure document sharing feature.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>PMY - Secure Title IX Consent Documentation</p>
        <p>For questions about this document, please contact the sender directly.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
PMY Consent Document Shared

A PMY user has shared a consent document with you.

Document Type: ${documentType}
Date: ${documentDate}
Shared By: ${from}

${pdfAttachment ? `Attachment: ${pdfAttachment.filename}` : 'The document details are included in this email for your records.'}

IMPORTANT: This is a legal consent document. Please store it securely and do not share it with unauthorized parties.

This document was sent via PMY's secure document sharing feature.
  `.trim();

  const emailData: any = {
    from: 'PMY Documents <documents@updates.pmy.app>',
    to,
    subject: `Consent Document from ${from}`,
    html: htmlContent,
    text: textContent,
  };

  // Add attachment if provided
  if (pdfAttachment) {
    emailData.attachments = [{
      filename: pdfAttachment.filename,
      content: pdfAttachment.content,
    }];
  }

  const result = await resend.emails.send(emailData);

  return result;
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail({
  to,
  name
}: SendWelcomeEmailParams) {
  const appUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://pmy.app';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to PMY</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to PMY!</h1>
        <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 16px;">Secure Title IX Consent Documentation</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${name}, thanks for joining!</h2>
        
        <p>Your PMY account is now active and ready to use. You can start documenting consent using any of our four secure methods:</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 16px; color: #16a34a;">Four Documentation Methods</h3>
          <ul style="margin: 10px 0; padding-left: 20px; color: #555;">
            <li><strong>Digital Signatures:</strong> Sign consent contracts digitally</li>
            <li><strong>Audio Recording:</strong> Record verbal consent agreements</li>
            <li><strong>Photo Capture:</strong> Document consent with dual selfies</li>
            <li><strong>Biometric Auth:</strong> Use Touch ID, Face ID, or Windows Hello</li>
          </ul>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Start Documenting Consent
          </a>
        </div>
        
        <div style="background: #e8f5e9; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #1b5e20; font-size: 14px;">
            <strong>Title IX Compliant:</strong> All documentation methods meet Title IX requirements and include university-specific policy guidance.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #888; border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
          Need help? Visit our help center or reply to this email.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>PMY - Secure Title IX Consent Documentation</p>
        <p>You're receiving this because you created a PMY account.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to PMY!

Hi ${name}, thanks for joining!

Your PMY account is now active and ready to use. You can start documenting consent using any of our four secure methods:

Four Documentation Methods:
• Digital Signatures: Sign consent contracts digitally
• Audio Recording: Record verbal consent agreements
• Photo Capture: Document consent with dual selfies
• Biometric Auth: Use Touch ID, Face ID, or Windows Hello

Title IX Compliant: All documentation methods meet Title IX requirements and include university-specific policy guidance.

Get started: ${appUrl}

Need help? Visit our help center or reply to this email.

---
PMY - Secure Title IX Consent Documentation
You're receiving this because you created a PMY account.
  `.trim();

  const result = await resend.emails.send({
    from: 'PMY <welcome@updates.pmy.app>',
    to,
    subject: 'Welcome to PMY - Your Account is Ready',
    html: htmlContent,
    text: textContent,
  });

  return result;
}

/**
 * Send password reset email with reset token
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetToken
}: SendPasswordResetEmailParams) {
  const appUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://pmy.app';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your PMY Password</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">PMY Account Security</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
        
        <p>We received a request to reset the password for your PMY account. Click the button below to create a new password:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Reset Your Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 13px; color: #667eea; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
          ${resetUrl}
        </p>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Security Note:</strong> This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #888; border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
          For security reasons, we cannot reset your password for you. Only you can reset it using the link above.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>PMY - Secure Title IX Consent Documentation</p>
        <p>If you didn't request this, please contact support immediately.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Password Reset Request

Hi ${name},

We received a request to reset the password for your PMY account. Click the link below to create a new password:

${resetUrl}

Security Note: This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.

For security reasons, we cannot reset your password for you. Only you can reset it using the link above.

---
PMY - Secure Title IX Consent Documentation
If you didn't request this, please contact support immediately.
  `.trim();

  const result = await resend.emails.send({
    from: 'PMY Security <security@updates.pmy.app>',
    to,
    subject: 'Reset Your PMY Password',
    html: htmlContent,
    text: textContent,
  });

  return result;
}

/**
 * Send password reset confirmation email
 */
export async function sendPasswordResetConfirmationEmail({
  to,
  name
}: SendPasswordResetConfirmationParams) {
  const appUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://pmy.app';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Successful</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your PMY Account is Secure</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
        
        <p>Your PMY password has been successfully reset. You can now sign in with your new password.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${appUrl}/auth" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Sign In to PMY
          </a>
        </div>
        
        <div style="background: #e8f5e9; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #1b5e20; font-size: 14px;">
            <strong>Your account is secure.</strong> All active sessions have been logged out for your protection.
          </p>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Didn't reset your password?</strong> If you didn't make this change, contact our support team immediately as your account may be compromised.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #888; border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
          Need help? Visit our help center or reply to this email.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>PMY - Secure Title IX Consent Documentation</p>
        <p>This is an automated security notification.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Password Reset Successful

Hi ${name},

Your PMY password has been successfully reset. You can now sign in with your new password.

Sign in: ${appUrl}/auth

Your account is secure. All active sessions have been logged out for your protection.

Didn't reset your password? If you didn't make this change, contact our support team immediately as your account may be compromised.

Need help? Visit our help center or reply to this email.

---
PMY - Secure Title IX Consent Documentation
This is an automated security notification.
  `.trim();

  const result = await resend.emails.send({
    from: 'PMY Security <security@updates.pmy.app>',
    to,
    subject: 'Your PMY Password Has Been Reset',
    html: htmlContent,
    text: textContent,
  });

  return result;
}

interface SendAmendmentRequestEmailParams {
  to: string;
  recipientName: string;
  requesterName: string;
  amendmentType: string;
  reason: string;
}

interface SendAmendmentApprovedEmailParams {
  to: string;
  recipientName: string;
  approverName: string;
  amendmentType: string;
}

interface SendAmendmentRejectedEmailParams {
  to: string;
  recipientName: string;
  rejectorName: string;
  amendmentType: string;
  rejectionReason?: string;
}

/**
 * Send amendment request notification email via Resend
 */
export async function sendAmendmentRequestEmail({
  to,
  recipientName,
  requesterName,
  amendmentType,
  reason
}: SendAmendmentRequestEmailParams) {
  const appUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://pmy.app';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Amendment Request</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Amendment Request</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">PMY Consent Documentation</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${recipientName},</h2>
        
        <p>${requesterName} has requested an amendment to your consent contract.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Amendment Type:</strong> ${amendmentType}</p>
          <p style="margin: 5px 0;"><strong>Requested By:</strong> ${requesterName}</p>
        </div>
        
        <div style="background: #e0e7ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 5px 0; font-weight: bold; color: #1e40af;">Reason:</p>
          <p style="margin: 0; color: #1e3a8a; font-style: italic;">"${reason}"</p>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${appUrl}/files" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Review Amendment Request
          </a>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Action Required:</strong> Please review this amendment request and approve or reject it in the PMY app.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #888; border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
          You can manage your amendment requests in the Amendments tab of your PMY dashboard.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>PMY - Secure Title IX Consent Documentation</p>
        <p>This is an automated notification.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Amendment Request

Hi ${recipientName},

${requesterName} has requested an amendment to your consent contract.

Amendment Type: ${amendmentType}
Requested By: ${requesterName}

Reason: "${reason}"

Review Amendment Request: ${appUrl}/files

Action Required: Please review this amendment request and approve or reject it in the PMY app.

You can manage your amendment requests in the Amendments tab of your PMY dashboard.

---
PMY - Secure Title IX Consent Documentation
This is an automated notification.
  `.trim();

  const result = await resend.emails.send({
    from: 'PMY Notifications <notifications@updates.pmy.app>',
    to,
    subject: `Amendment Request from ${requesterName}`,
    html: htmlContent,
    text: textContent,
  });

  return result;
}

/**
 * Send amendment approved notification email via Resend
 */
export async function sendAmendmentApprovedEmail({
  to,
  recipientName,
  approverName,
  amendmentType
}: SendAmendmentApprovedEmailParams) {
  const appUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://pmy.app';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Amendment Approved</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Amendment Approved</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">PMY Consent Documentation</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${recipientName},</h2>
        
        <p>Good news! ${approverName} has approved your amendment request.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Amendment Type:</strong> ${amendmentType}</p>
          <p style="margin: 5px 0;"><strong>Approved By:</strong> ${approverName}</p>
        </div>
        
        <div style="background: #d1fae5; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #065f46; font-size: 14px;">
            <strong>Amendment Approved:</strong> Your consent contract has been updated with the approved changes.
          </p>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${appUrl}/files" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            View Updated Contract
          </a>
        </div>
        
        <p style="font-size: 14px; color: #888; border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
          You can view your updated contract in the Active Contracts section of your PMY dashboard.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>PMY - Secure Title IX Consent Documentation</p>
        <p>This is an automated notification.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Amendment Approved

Hi ${recipientName},

Good news! ${approverName} has approved your amendment request.

Amendment Type: ${amendmentType}
Approved By: ${approverName}

Amendment Approved: Your consent contract has been updated with the approved changes.

View Updated Contract: ${appUrl}/files

You can view your updated contract in the Active Contracts section of your PMY dashboard.

---
PMY - Secure Title IX Consent Documentation
This is an automated notification.
  `.trim();

  const result = await resend.emails.send({
    from: 'PMY Notifications <notifications@updates.pmy.app>',
    to,
    subject: `Amendment Approved by ${approverName}`,
    html: htmlContent,
    text: textContent,
  });

  return result;
}

/**
 * Send amendment rejected notification email via Resend
 */
export async function sendAmendmentRejectedEmail({
  to,
  recipientName,
  rejectorName,
  amendmentType,
  rejectionReason
}: SendAmendmentRejectedEmailParams) {
  const appUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://pmy.app';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Amendment Rejected</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Amendment Rejected</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">PMY Consent Documentation</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${recipientName},</h2>
        
        <p>${rejectorName} has rejected your amendment request.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Amendment Type:</strong> ${amendmentType}</p>
          <p style="margin: 5px 0;"><strong>Rejected By:</strong> ${rejectorName}</p>
        </div>
        
        ${rejectionReason ? `
          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 5px 0; font-weight: bold; color: #991b1b;">Rejection Reason:</p>
            <p style="margin: 0; color: #7f1d1d; font-style: italic;">"${rejectionReason}"</p>
          </div>
        ` : ''}
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>ℹ️ Next Steps:</strong> Your original consent contract remains unchanged. You can discuss this with your partner and submit a new amendment request if needed.
          </p>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${appUrl}/files" style="display: inline-block; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            View Your Contracts
          </a>
        </div>
        
        <p style="font-size: 14px; color: #888; border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
          You can view your contracts in the PMY dashboard or create a new amendment request.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p>PMY - Secure Title IX Consent Documentation</p>
        <p>This is an automated notification.</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Amendment Rejected

Hi ${recipientName},

${rejectorName} has rejected your amendment request.

Amendment Type: ${amendmentType}
Rejected By: ${rejectorName}

${rejectionReason ? `Rejection Reason: "${rejectionReason}"` : ''}

ℹ️ Next Steps: Your original consent contract remains unchanged. You can discuss this with your partner and submit a new amendment request if needed.

View Your Contracts: ${appUrl}/files

You can view your contracts in the PMY dashboard or create a new amendment request.

---
PMY - Secure Title IX Consent Documentation
This is an automated notification.
  `.trim();

  const result = await resend.emails.send({
    from: 'PMY Notifications <notifications@updates.pmy.app>',
    to,
    subject: `Amendment Rejected by ${rejectorName}`,
    html: htmlContent,
    text: textContent,
  });

  return result;
}
