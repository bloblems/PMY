// Supabase Edge Function for sending emails
// Supports SendGrid or Resend as the email provider

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface ContractInviteRequest {
  type: "contract_invite";
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  contractId: string;
  inviteUrl: string;
}

interface AmendmentNotificationRequest {
  type: "amendment_notification";
  recipientEmail: string;
  recipientName?: string;
  requesterName: string;
  contractId: string;
  amendmentType: string;
  amendmentDescription: string;
}

interface PasswordResetRequest {
  type: "password_reset";
  recipientEmail: string;
  resetUrl: string;
}

type EmailTemplateRequest = ContractInviteRequest | AmendmentNotificationRequest | PasswordResetRequest;

// Email templates
const templates = {
  contract_invite: (data: ContractInviteRequest) => ({
    subject: `${data.senderName} has invited you to a PMY Consent Contract`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contract Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #34C759 0%, #30B350 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">PMY Contract Invitation</h1>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e5ea; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hi${data.recipientName ? ` ${data.recipientName}` : ''},</p>
            <p style="font-size: 16px;"><strong>${data.senderName}</strong> has invited you to review and approve a consent contract on PMY (Press Means Yes).</p>
            <p style="font-size: 16px;">PMY is a secure platform for documenting mutual consent in a clear, verifiable way.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.inviteUrl}" style="display: inline-block; background: #34C759; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Review Contract</a>
            </div>
            <p style="font-size: 14px; color: #666;">If you have any questions or concerns, please contact the sender directly.</p>
            <hr style="border: none; border-top: 1px solid #e5e5ea; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This email was sent by PMY (Press Means Yes). If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `${data.senderName} has invited you to a PMY Consent Contract.\n\nVisit this link to review: ${data.inviteUrl}\n\nIf you have any questions, please contact the sender directly.`,
  }),

  amendment_notification: (data: AmendmentNotificationRequest) => ({
    subject: `Amendment Requested for PMY Contract`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Amendment Request</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Amendment Requested</h1>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e5ea; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hi${data.recipientName ? ` ${data.recipientName}` : ''},</p>
            <p style="font-size: 16px;"><strong>${data.requesterName}</strong> has requested an amendment to a consent contract you're part of.</p>
            <div style="background: #f8f8f8; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-weight: 600;">Amendment Type:</p>
              <p style="margin: 0; color: #666;">${data.amendmentType}</p>
              <p style="margin: 16px 0 8px 0; font-weight: 600;">Description:</p>
              <p style="margin: 0; color: #666;">${data.amendmentDescription}</p>
            </div>
            <p style="font-size: 16px;">Please log in to PMY to review and approve or reject this amendment request.</p>
            <hr style="border: none; border-top: 1px solid #e5e5ea; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated notification from PMY (Press Means Yes).
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Amendment Requested\n\n${data.requesterName} has requested an amendment to a consent contract.\n\nAmendment Type: ${data.amendmentType}\nDescription: ${data.amendmentDescription}\n\nPlease log in to PMY to review this request.`,
  }),

  password_reset: (data: PasswordResetRequest) => ({
    subject: `Reset your PMY password`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
          </div>
          <div style="background: #fff; padding: 30px; border: 1px solid #e5e5ea; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hi,</p>
            <p style="font-size: 16px;">We received a request to reset your password for your PMY account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" style="display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #666;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e5ea; margin: 20px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This email was sent by PMY (Press Means Yes).
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Password Reset\n\nWe received a request to reset your password for your PMY account.\n\nClick this link to reset: ${data.resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can safely ignore this email.`,
  }),
};

async function sendWithResend(email: EmailRequest): Promise<Response> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: email.from || "PMY <noreply@pmy.app>",
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      reply_to: email.replyTo,
    }),
  });

  return response;
}

async function sendWithSendGrid(email: EmailRequest): Promise<Response> {
  const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
  if (!SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY not configured");
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: email.to }] }],
      from: { email: email.from || "noreply@pmy.app", name: "PMY" },
      subject: email.subject,
      content: [
        { type: "text/plain", value: email.text || "" },
        { type: "text/html", value: email.html },
      ],
      reply_to: email.replyTo ? { email: email.replyTo } : undefined,
    }),
  });

  return response;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Determine email provider (prefer Resend, fallback to SendGrid)
    const emailProvider = Deno.env.get("EMAIL_PROVIDER") || "resend";
    const sendEmail = emailProvider === "sendgrid" ? sendWithSendGrid : sendWithResend;

    let emailData: EmailRequest;

    // Check if this is a template request or direct email
    if (body.type && templates[body.type as keyof typeof templates]) {
      const template = templates[body.type as keyof typeof templates](body as EmailTemplateRequest);
      emailData = {
        to: body.recipientEmail || body.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        from: body.from,
        replyTo: body.replyTo,
      };
    } else {
      // Direct email request
      emailData = {
        to: body.to,
        subject: body.subject,
        html: body.html,
        text: body.text,
        from: body.from,
        replyTo: body.replyTo,
      };
    }

    if (!emailData.to || !emailData.subject || !emailData.html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await sendEmail(emailData);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Email send failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorText }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await response.json().catch(() => ({ success: true }));

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
