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
              <strong>📎 Attachment:</strong> ${pdfAttachment.filename}
            </p>
          </div>
        ` : `
          <p style="color: #555;">The document details are included in this email for your records.</p>
        `}
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>⚠️ Important:</strong> This is a legal consent document. Please store it securely and do not share it with unauthorized parties.
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
