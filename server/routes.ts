import type { Express } from "express";
import { createServer, type Server } from "http";
import storage from "./storage";
import { insertConsentRecordingSchema, insertConsentContractSchema, insertUniversityReportSchema, insertVerificationPaymentSchema, insertContractAmendmentSchema, type ConsentContract, shareContractSchema, rejectContractSchema } from "@shared/schema";
import multer from "multer";
import OpenAI from "openai";
import Stripe from "stripe";
import { generateChallenge, verifyAttestation, generateSessionId } from "./webauthn";
import { sendDocumentEmail } from "./email";
import rateLimit from "express-rate-limit";
import { validateFileUpload } from "./fileValidation";
import { logConsentEvent, logRateLimitViolation } from "./securityLogger";
import { requireAuth } from "./supabaseAuth";
import { supabaseAdmin } from "./supabase";
import notificationsRouter from "./routes/notifications";
import recordingsRouter from "./routes/recordings";
import amendmentsRouter from "./routes/amendments";
import universitiesRouter from "./routes/universities";
import stateRouter from "./routes/state-laws";
import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import contractsRouter from "./routes/contracts";

const upload = multer({ storage: multer.memoryStorage() });

// Rate limiting configuration for document sharing endpoint
// Prevents abuse of email-sending functionality
const documentShareRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // Limit each user to 20 document shares per hour
  message: "Too many documents shared. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = req.user;
    return user?.id || 'unauthenticated';
  },
  skipFailedRequests: true,
  handler: (req, res) => {
    const user = req.user;
    logRateLimitViolation(
      req,
      "document_share",
      user?.id
    );
    res.status(429).json({
      error: "Too many documents shared. Please try again in an hour.",
    });
  },
});

// Helper function to validate Base64 signature size
// Base64 encoding increases size by ~33%, so we decode to get true byte size
function validateSignatureSize(dataURL: string, maxBytes: number = 2 * 1024 * 1024): { valid: boolean; error?: string } {
  if (!dataURL) return { valid: true };
  
  try {
    // Remove data URL prefix (e.g., "data:image/png;base64,")
    const base64Data = dataURL.split(',')[1] || dataURL;
    
    // Calculate decoded byte size: (Base64 length * 3) / 4, minus padding
    // Count padding characters (= at the end)
    const padding = (base64Data.match(/=/g) || []).length;
    const decodedSize = Math.floor((base64Data.length * 3) / 4) - padding;
    
    if (decodedSize > maxBytes) {
      const sizeMB = (decodedSize / (1024 * 1024)).toFixed(2);
      const maxMB = (maxBytes / (1024 * 1024)).toFixed(2);
      return { 
        valid: false, 
        error: `Size is too large (${sizeMB}MB exceeds ${maxMB}MB limit)` 
      };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid format" };
  }
}

const getStripeKey = (): string | null => {
  // Allow completely disabling Stripe for testing environments
  if (process.env.DISABLE_STRIPE_FOR_TESTS === 'true') {
    console.log('[Stripe] Disabled for testing environment');
    return null;
  }
  
  const testingKey = process.env.TESTING_STRIPE_SECRET_KEY;
  const prodKey = process.env.STRIPE_SECRET_KEY;
  
  if (process.env.NODE_ENV === 'test' || testingKey) {
    const key = testingKey || prodKey;
    if (key) {
      const keyPrefix = key.substring(0, 7);
      console.log(`[Stripe] Using testing secret key (prefix: ${keyPrefix}...)`);
      return key;
    }
  }
  
  if (prodKey) {
    const keyPrefix = prodKey.substring(0, 7);
    console.log(`[Stripe] Using production secret key (prefix: ${keyPrefix}...)`);
    return prodKey;
  }
  
  console.log('[Stripe] No Stripe keys configured - payment features will be disabled');
  return null;
};

// Initialize Stripe only if keys are available
const stripeKey = getStripeKey();
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: "2025-10-29.clover",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // ===== Domain Routers =====
  // Register modular domain-specific routers
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/recordings", recordingsRouter);
  app.use("/api/amendments", amendmentsRouter);
  app.use("/api/universities", universitiesRouter);
  app.use("/api/state-laws", stateRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api", contractsRouter);
  
  // Search users by username (for social features / collaboration)
  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      if (query.length < 2) {
        return res.status(400).json({ error: "Query must be at least 2 characters" });
      }
      
      // Search for users by username (supports '@' prefix)
      const users = await storage.searchUsersByUsername(query, 10);
      
      // Return limited profile information for privacy
      const results = users.map(user => ({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio,
        isVerified: user.isVerified || "false",
        verificationProvider: user.verificationProvider || null,
      }));
      
      return res.json({ users: results });
    } catch (error) {
      console.error("Error searching users:", error);
      return res.status(500).json({ error: "Failed to search users" });
    }
  });

  // WebAuthn endpoints for secure biometric authentication
  app.post("/api/webauthn/challenge", async (req, res) => {
    try {
      const { userName } = req.body;
      const origin = `${req.protocol}://${req.get('host')}`;
      
      if (!userName) {
        return res.status(400).json({ error: "userName is required" });
      }

      // Generate unique session ID
      const sessionId = generateSessionId();
      
      // Generate challenge options
      const options = await generateChallenge(sessionId, userName, origin);
      
      res.json({ sessionId, options });
    } catch (error) {
      console.error("Error generating WebAuthn challenge:", error);
      res.status(500).json({ error: "Failed to generate challenge" });
    }
  });

  app.post("/api/webauthn/verify", async (req, res) => {
    try {
      const { sessionId, attestationResponse } = req.body;
      const origin = `${req.protocol}://${req.get('host')}`;
      
      if (!sessionId || !attestationResponse) {
        return res.status(400).json({ error: "sessionId and attestationResponse are required" });
      }

      // Verify the attestation
      const verification = await verifyAttestation(sessionId, attestationResponse, origin);
      
      if (!verification.verified) {
        return res.status(400).json({ error: "Verification failed" });
      }

      // Extract credential data from registrationInfo.credential
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
      
      if (!credential) {
        return res.status(500).json({ error: "Missing credential data in verification result" });
      }
      
      res.json({
        verified: true,
        credentialId: Buffer.from(credential.id).toString('base64'),
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter,
        credentialDeviceType,
        credentialBackedUp,
      });
    } catch (error: any) {
      console.error("Error verifying WebAuthn attestation:", error);
      res.status(400).json({ error: error.message || "Verification failed" });
    }
  });

  // Report outdated university information

  // Get a single contract (requires authentication and ownership)

  // Create a new contract (requires authentication)

  // Delete a contract

  // Pause an active contract

  // Resume a paused contract

  // New consent creation endpoints with enhanced fields (requires authentication)




  // Report outdated university information
  app.post("/api/reports", async (req, res) => {
    try {
      const parsed = insertUniversityReportSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid report data" });
      }

      const report = await storage.createReport(parsed.data);
      res.json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // Get all reports (admin)
  app.get("/api/admin/reports", async (_req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // Get pending reports (admin)
  app.get("/api/admin/reports/pending", async (_req, res) => {
    try {
      const reports = await storage.getPendingReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending reports" });
    }
  });

  // Update university Title IX information (admin)
  app.patch("/api/admin/universities/:id/title-ix", async (req, res) => {
    try {
      const { id } = req.params;
      const { titleIXInfo, titleIXUrl } = req.body;

      if (!titleIXInfo) {
        return res.status(400).json({ error: "titleIXInfo is required" });
      }

      const updated = await storage.updateUniversityTitleIX(id, titleIXInfo, titleIXUrl);
      
      if (!updated) {
        return res.status(404).json({ error: "University not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating university:", error);
      res.status(500).json({ error: "Failed to update university" });
    }
  });

  // Verify university information (admin)
  app.patch("/api/admin/universities/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      const verified = await storage.verifyUniversity(id);
      
      if (!verified) {
        return res.status(404).json({ error: "University not found" });
      }

      res.json(verified);
    } catch (error) {
      console.error("Error verifying university:", error);
      res.status(500).json({ error: "Failed to verify university" });
    }
  });

  // Resolve a report (admin)
  app.patch("/api/admin/reports/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;
      const resolved = await storage.resolveReport(id);
      
      if (!resolved) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json(resolved);
    } catch (error) {
      console.error("Error resolving report:", error);
      res.status(500).json({ error: "Failed to resolve report" });
    }
  });

  // Generate AI summary of Title IX policy
  app.post("/api/summarize-policy", async (req, res) => {
    try {
      const { titleIXInfo } = req.body;

      if (!titleIXInfo || typeof titleIXInfo !== 'string') {
        return res.status(400).json({ error: "Missing or invalid titleIXInfo" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes Title IX consent policies for college students. Create concise, clear summaries that highlight the most important points about consent requirements, reporting procedures, and student rights. Keep summaries to 2-3 sentences maximum."
          },
          {
            role: "user",
            content: `Please summarize the following Title IX policy information:\n\n${titleIXInfo}`
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const summary = completion.choices[0]?.message?.content || "Summary unavailable";

      res.json({ summary });
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // Create Stripe checkout session for verification
  app.post("/api/verify/create-checkout", async (req, res) => {
    try {
      // Check if Stripe is configured
      if (!stripe) {
        return res.status(503).json({ 
          error: "Payment processing is not available",
          details: "Stripe is not configured on this server"
        });
      }

      const { universityId, gpuModel } = req.body;

      if (!universityId || !gpuModel) {
        return res.status(400).json({ error: "Missing universityId or gpuModel" });
      }

      const university = await storage.getUniversity(universityId);
      if (!university) {
        return res.status(404).json({ error: "University not found" });
      }

      const prices = {
        "gpt-4": 500,
        "gpt-4-turbo": 300,
        "gpt-4o": 200,
      };

      const price = prices[gpuModel as keyof typeof prices];
      if (!price) {
        return res.status(400).json({ error: "Invalid GPU model" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Title IX Verification - ${university.name}`,
                description: `AI-powered verification using ${gpuModel}`,
              },
              unit_amount: price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/info?verification=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/info?verification=cancelled`,
        metadata: {
          universityId,
          gpuModel,
        },
      });

      const payment = await storage.createVerificationPayment({
        universityId,
        stripeSessionId: session.id,
        amount: price.toString(),
        gpuModel,
        stripePaymentStatus: "pending",
        verificationStatus: "pending",
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Stripe webhook handler
  app.post("/api/verify/webhook", async (req, res) => {
    // Check if Stripe is configured
    if (!stripe) {
      console.error("[Stripe Webhook] Stripe not configured");
      return res.status(503).send("Payment processing is not available");
    }

    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).send("No signature");
    }

    let event: Stripe.Event;

    try {
      const rawBody = (req as any).rawBody;
      
      if (!rawBody) {
        console.error("Webhook error: No raw body available");
        return res.status(400).send("Webhook Error: No raw body");
      }

      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const payment = await storage.getVerificationPaymentBySessionId(session.id);

      if (payment) {
        console.log(`Processing verification payment ${payment.id} for university ${payment.universityId}`);
        
        await storage.updateVerificationPaymentStatus(
          payment.id,
          "paid",
          "processing"
        );

        processVerification(payment.id, payment.universityId, payment.gpuModel);
      } else {
        console.error(`Payment not found for session ${session.id}`);
      }
    }

    res.json({ received: true });
  });

  // Get verification status
  app.get("/api/verify/status/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const payment = await storage.getVerificationPaymentBySessionId(sessionId);

      if (!payment) {
        return res.status(404).json({ error: "Verification not found" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error getting verification status:", error);
      res.status(500).json({ error: "Failed to get verification status" });
    }
  });

  // ================================================================
  // ACCOUNT/IDENTITY VERIFICATION ENDPOINTS
  // ================================================================
  
  // Initiate account verification (Stripe Identity)
  app.post("/api/account-verification/initiate", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const { provider = "stripe_identity" } = req.body;

      // Check if Stripe is configured
      if (!stripe) {
        return res.status(503).json({ 
          error: "Verification service is not available",
          details: "Stripe Identity is not configured on this server"
        });
      }

      // Check if user is already verified
      const profile = await storage.getUserProfile(user.id);
      if (profile && profile.isVerified === "true") {
        return res.status(400).json({ error: "Account is already verified" });
      }

      // Check retry eligibility (48-hour cooldown after failed attempt)
      const retryCheck = await storage.checkRetryEligibility(user.id);
      if (!retryCheck.canRetry) {
        return res.status(429).json({ 
          error: "Please wait before retrying verification",
          canRetryAt: retryCheck.canRetryAt?.toISOString()
        });
      }

      // Create PaymentIntent for $5 verification fee
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 500, // $5.00 in cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          purpose: "account_verification",
          userId: user.id,
        },
      });

      // Create Stripe Identity VerificationSession
      const verificationSession = await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: {
          userId: user.id,
          paymentIntentId: paymentIntent.id,
        },
        options: {
          document: {
            require_matching_selfie: true, // Require selfie for higher security
          },
        },
      });

      // Store verification record in database
      const verification = await storage.createAccountVerification({
        userId: user.id,
        provider,
        sessionId: verificationSession.id,
        stripePaymentIntentId: paymentIntent.id,
        status: "pending",
        paymentStatus: "pending",
      });

      res.json({
        verificationSessionId: verificationSession.id,
        clientSecret: verificationSession.client_secret,
        paymentIntentClientSecret: paymentIntent.client_secret,
        verificationId: verification.id,
      });
    } catch (error) {
      console.error("Error initiating account verification:", error);
      res.status(500).json({ error: "Failed to initiate verification" });
    }
  });

  // Get account verification status
  app.get("/api/account-verification/status", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Get user's profile to check verified status
      const profile = await storage.getUserProfile(user.id);
      
      // Get latest verification attempt
      const latestVerification = await storage.getLatestAccountVerification(user.id);
      
      // Check retry eligibility
      const retryCheck = await storage.checkRetryEligibility(user.id);

      res.json({
        isVerified: profile?.isVerified === "true",
        verificationProvider: profile?.verificationProvider || null,
        verifiedAt: profile?.verifiedAt?.toISOString() || null,
        verificationLevel: profile?.verificationLevel || null,
        latestAttempt: latestVerification || null,
        canRetry: retryCheck.canRetry,
        canRetryAt: retryCheck.canRetryAt?.toISOString() || null,
      });
    } catch (error) {
      console.error("Error getting verification status:", error);
      res.status(500).json({ error: "Failed to get verification status" });
    }
  });

  // Stripe Identity webhook handler
  app.post("/api/account-verification/webhook", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: "Stripe is not configured" });
      }

      const sig = req.headers["stripe-signature"];
      if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).send("Missing signature or webhook secret");
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Handle different event types
      switch (event.type) {
        case "identity.verification_session.verified":
          {
            const session = event.data.object as Stripe.Identity.VerificationSession;
            console.log(`Verification session ${session.id} verified`);

            // Update verification status to verified
            await storage.updateAccountVerificationStatus(
              session.id,
              "verified",
              JSON.stringify(session.verified_outputs || {}),
              undefined,
              session.type
            );

            // Get the verification record to find userId
            const verification = await storage.getAccountVerificationBySessionId(session.id);
            if (verification) {
              // Mark user as verified in their profile
              await storage.setUserVerified(
                verification.userId,
                "stripe_identity",
                session.type,
                JSON.stringify(session.verified_outputs || {})
              );
            }
          }
          break;

        case "identity.verification_session.requires_input":
          {
            const session = event.data.object as Stripe.Identity.VerificationSession;
            console.log(`Verification session ${session.id} requires input`);
            
            await storage.updateAccountVerificationStatus(
              session.id,
              "processing",
              undefined,
              "Additional input required"
            );
          }
          break;

        case "identity.verification_session.processing":
          {
            const session = event.data.object as Stripe.Identity.VerificationSession;
            console.log(`Verification session ${session.id} is processing`);
            
            await storage.updateAccountVerificationStatus(
              session.id,
              "processing"
            );
          }
          break;

        case "identity.verification_session.canceled":
          {
            const session = event.data.object as Stripe.Identity.VerificationSession;
            console.log(`Verification session ${session.id} was canceled`);
            
            await storage.updateAccountVerificationStatus(
              session.id,
              "failed",
              undefined,
              "Verification canceled by user"
            );
          }
          break;

        case "payment_intent.succeeded":
          {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            
            // Check if this is an account verification payment
            if (paymentIntent.metadata.purpose === "account_verification") {
              console.log(`Payment succeeded for verification: ${paymentIntent.id}`);
              
              // Find verification by payment intent ID
              const verifications = await storage.getLatestAccountVerification(
                paymentIntent.metadata.userId
              );
              
              if (verifications && verifications.stripePaymentIntentId === paymentIntent.id) {
                await storage.updateAccountVerificationPaymentStatus(
                  verifications.sessionId,
                  "succeeded",
                  paymentIntent.id
                );
              }
            }
          }
          break;

        case "payment_intent.payment_failed":
          {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            
            // Check if this is an account verification payment
            if (paymentIntent.metadata.purpose === "account_verification") {
              console.log(`Payment failed for verification: ${paymentIntent.id}`);
              
              // Find verification by payment intent ID
              const verifications = await storage.getLatestAccountVerification(
                paymentIntent.metadata.userId
              );
              
              if (verifications && verifications.stripePaymentIntentId === paymentIntent.id) {
                await storage.updateAccountVerificationPaymentStatus(
                  verifications.sessionId,
                  "failed"
                );
                
                // Also mark verification as failed since payment failed
                await storage.updateAccountVerificationStatus(
                  verifications.sessionId,
                  "failed",
                  undefined,
                  "Payment failed"
                );
              }
            }
          }
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error handling verification webhook:", error);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  });

  // Share document via email
  app.post("/api/share-document", requireAuth, documentShareRateLimiter, async (req, res) => {
    try {
      const user = req.user!;
      const { documentId, documentType, recipientEmail } = req.body;

      if (!documentId || !documentType || !recipientEmail) {
        return res.status(400).json({ 
          error: "Document ID, type, and recipient email are required" 
        });
      }

      // Validate document type
      if (!["contract", "recording", "photo", "biometric"].includes(documentType)) {
        return res.status(400).json({ error: "Invalid document type" });
      }

      // Get user profile
      const sender = await storage.getUserProfile(user.id);
      if (!sender) {
        return res.status(404).json({ error: "User not found" });
      }

      // SECURITY: Verify ownership FIRST before constructing any document details
      // This prevents leaking metadata about documents the user doesn't own
      if (documentType === "contract") {
        const contract = await storage.getContract(documentId, user.id);
        if (!contract) {
          // Return 404 without leaking any document information
          return res.status(404).json({ error: "Contract not found or access denied" });
        }
        
        // Only construct document details AFTER ownership is verified
        const documentDate = new Date(contract.createdAt).toLocaleDateString();
        const documentDetails = "Digital Signature Consent Contract";
        
        // Send document email via Resend with error handling
        try {
          const senderEmail = user.email || 'noreply@pmy-consent.app';
          
          await sendDocumentEmail({
            to: recipientEmail,
            from: senderEmail,
            documentType: documentDetails,
            documentDate,
          });
          
          return res.json({ 
            success: true, 
            message: "Document shared successfully" 
          });
        } catch (emailError) {
          console.error("Error sending document email via Resend:", emailError);
          return res.status(502).json({ 
            error: "Failed to send email. Please try again later." 
          });
        }
      } else if (documentType === "recording") {
        const recording = await storage.getRecording(documentId, user.id);
        if (!recording) {
          // Return 404 without leaking any document information
          return res.status(404).json({ error: "Recording not found or access denied" });
        }
        
        // Only construct document details AFTER ownership is verified
        const documentDate = new Date(recording.createdAt).toLocaleDateString();
        const documentDetails = `Audio/Video Consent Recording`;
        
        // Send document email via Resend with error handling
        try {
          const senderEmail = user.email || 'noreply@pmy-consent.app';
          
          await sendDocumentEmail({
            to: recipientEmail,
            from: senderEmail,
            documentType: documentDetails,
            documentDate,
          });
          
          return res.json({ 
            success: true, 
            message: "Document shared successfully" 
          });
        } catch (emailError) {
          console.error("Error sending document email via Resend:", emailError);
          return res.status(502).json({ 
            error: "Failed to send email. Please try again later." 
          });
        }
      } else {
        // For photo and biometric, we'll add support later
        return res.status(400).json({ 
          error: "Document type not yet supported for email sharing" 
        });
      }
    } catch (error) {
      console.error("Error sharing document:", error);
      res.status(500).json({ error: "Failed to share document" });
    }
  });

  // ===== Collaborative Contract Endpoints =====
  
  // Get user's draft contracts

  // Create a draft contract (doesn't require signatures)

  // Update an existing draft contract

  // Get contracts user is collaborating on

  // Share a contract with another user via email invitation

  // Get all invitations for current user

  // Get in-app PMY user invitations (pending collaborator invitations)

  // Get invitation details by code (public endpoint - no auth required)

  // Accept a contract invitation and become a collaborator

  // Approve a collaborative contract

  // Reject a collaborative contract

  // Confirm consent (Press for Yes) - final activation step

  // Interpret custom consent terms using AI

  const httpServer = createServer(app);
  return httpServer;
}

async function processVerification(paymentId: string, universityId: string, gpuModel: string) {
  try {
    const university = await storage.getUniversity(universityId);
    if (!university) {
      await storage.updateVerificationPaymentStatus(paymentId, "paid", "failed", "University not found");
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: gpuModel as any,
      messages: [
        {
          role: "system",
          content: `You are an expert Title IX compliance analyst. Your task is to verify the accuracy of Title IX policy information for universities. You will receive:
1. University name and official Title IX URL
2. The stored Title IX policy text

Analyze whether the stored information appears accurate, comprehensive, and professional. Consider:
- Does it cover key Title IX topics (prohibited conduct, consent, reporting, resources)?
- Is it written in a professional, informative tone?
- Does it appear to be legitimate policy information (not placeholder text)?
- Is the URL format appropriate for a university Title IX office?

Respond in JSON format:
{
  "verified": true/false,
  "confidence": "high" | "medium" | "low",
  "summary": "Brief explanation of your assessment (2-3 sentences)",
  "recommendations": "Specific improvements needed, if any"
}`
        },
        {
          role: "user",
          content: `University: ${university.name}
Title IX URL: ${university.titleIXUrl || 'Not provided'}

Stored Policy Information:
${university.titleIXInfo}`
        }
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      await storage.updateVerificationPaymentStatus(paymentId, "paid", "failed", "No response from AI");
      return;
    }

    const analysis = JSON.parse(result);

    if (analysis.verified && analysis.confidence === "high") {
      await storage.verifyUniversity(universityId);
    }

    await storage.updateVerificationPaymentStatus(
      paymentId,
      "paid",
      "completed",
      JSON.stringify(analysis)
    );

  } catch (error) {
    console.error("Error processing verification:", error);
    await storage.updateVerificationPaymentStatus(
      paymentId,
      "paid",
      "failed",
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
