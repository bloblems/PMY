import { sql } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Universities table - public reference data
export const universities = pgTable("universities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  state: text("state").notNull(),
  titleIXInfo: text("title_ix_info").notNull(),
  titleIXUrl: text("title_ix_url"),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
});

// State consent laws table
export const stateLaws = pgTable("state_laws", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stateCode: text("state_code").notNull().unique(), // 2-letter state code (e.g., "CA", "NY")
  stateName: text("state_name").notNull(), // Full state name (e.g., "California")
  consentLawInfo: text("consent_law_info").notNull(), // Comprehensive consent law information
  ageOfConsent: integer("age_of_consent").notNull(), // Legal age of consent
  romeoJulietLaw: text("romeo_juliet_law"), // Close-in-age exemptions details
  affirmativeConsentRequired: text("affirmative_consent_required"), // "yes", "no", or details
  reportingRequirements: text("reporting_requirements"), // Mandatory reporting requirements
  sourceUrl: text("source_url"), // Link to official state law source
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }), // When verified by paid AI service
});

// User profiles table - links to auth.users (managed by Supabase Auth)
export const userProfiles = pgTable("users", {
  id: text("id").primaryKey(), // References auth.users(id)
  username: text("username").notNull().unique(), // Unique username for social features (@username)
  firstName: text("first_name"), // User's first name
  lastName: text("last_name"), // User's last name
  profilePictureUrl: text("profile_picture_url"),
  bio: text("bio"),
  websiteUrl: text("website_url"),
  savedSignature: text("saved_signature"),
  savedSignatureType: text("saved_signature_type"),
  savedSignatureText: text("saved_signature_text"),
  dataRetentionPolicy: text("data_retention_policy").notNull().default("forever"),
  stripeCustomerId: text("stripe_customer_id"),
  referralCode: text("referral_code"),
  referralCount: integer("referral_count").notNull().default(0),
  referredBy: text("referred_by"), // Username of user who referred this user
  // User preferences for consent flow defaults
  defaultUniversityId: varchar("default_university_id"), // References universities(id)
  stateOfResidence: text("state_of_residence"), // 2-letter state code (e.g., "CA", "NY")
  defaultEncounterType: text("default_encounter_type"), // Default encounter type
  defaultContractDuration: integer("default_contract_duration"), // Default duration in minutes
  // Identity verification status
  isVerified: text("is_verified").notNull().default("false"), // "true" or "false" - verified account badge
  verificationProvider: text("verification_provider"), // "stripe_identity" or "persona"
  verifiedAt: timestamp("verified_at", { withTimezone: true }), // When verification was completed
  verificationLevel: text("verification_level"), // Provider-specific verification level/tier
  // Notification preferences
  emailNotificationsEnabled: text("email_notifications_enabled").notNull().default("true"), // "true" or "false" - receive email notifications
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Consent recordings table
export const consentRecordings = pgTable("consent_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"), // References auth.users(id)
  universityId: varchar("university_id"), // References universities(id)
  encounterType: text("encounter_type"),
  parties: text("parties").array(),
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(),
  duration: text("duration").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Consent contracts table
export const consentContracts = pgTable("consent_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"), // References auth.users(id) - contract creator
  universityId: varchar("university_id"), // References universities(id)
  encounterType: text("encounter_type"),
  parties: text("parties").array(),
  contractStartTime: timestamp("contract_start_time", { withTimezone: true }),
  contractDuration: integer("contract_duration"), // Duration in minutes
  contractEndTime: timestamp("contract_end_time", { withTimezone: true }),
  method: text("method"),
  contractText: text("contract_text"),
  signature1: text("signature1"),
  signature2: text("signature2"),
  photoUrl: text("photo_url"),
  credentialId: text("credential_id"),
  credentialPublicKey: text("credential_public_key"),
  credentialCounter: text("credential_counter"),
  credentialDeviceType: text("credential_device_type"),
  credentialBackedUp: text("credential_backed_up"),
  authenticatedAt: timestamp("authenticated_at", { withTimezone: true }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  // Collaboration fields
  status: text("status").notNull().default("draft"), // draft, pending_approval, active, paused, completed, rejected
  isCollaborative: text("is_collaborative").notNull().default("false"), // "true" or "false"
  lastEditedBy: text("last_edited_by"), // References auth.users(id)
  intimateActs: text("intimate_acts"), // JSON string of intimate acts selections
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Contract collaborators table - tracks all participants in a collaborative contract
// Supports both PMY users (with userId) and non-PMY participants (with legalName only)
export const contractCollaborators = pgTable("contract_collaborators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(), // References consent_contracts(id)
  userId: text("user_id"), // References auth.users(id) - NULL for non-PMY participants
  legalName: text("legal_name"), // Full name for non-PMY participants, also stored for PMY users as display name
  contactInfo: text("contact_info"), // Email, phone, or other contact info for non-PMY participants
  participantType: text("participant_type").notNull().default("pmy_user"), // "pmy_user" or "external"
  role: text("role").notNull(), // "initiator" or "recipient"
  status: text("status").notNull().default("pending"), // pending, reviewing, approved, rejected
  lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }), // When party pressed "Yes" to activate contract
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Contract invitations table - manages email-based sharing
export const contractInvitations = pgTable("contract_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(), // References consent_contracts(id)
  senderId: text("sender_id").notNull(), // References auth.users(id)
  recipientEmail: text("recipient_email").notNull(),
  recipientUserId: text("recipient_user_id"), // References auth.users(id) - set when invitation accepted
  invitationCode: text("invitation_code").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// University reports table
export const universityReports = pgTable("university_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  universityId: varchar("university_id").notNull(), // References universities(id)
  reportType: text("report_type").notNull(),
  description: text("description").notNull(),
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("pending"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

// Verification payments table
export const verificationPayments = pgTable("verification_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"), // References auth.users(id)
  universityId: varchar("university_id").notNull(), // References universities(id)
  stripeSessionId: text("stripe_session_id").notNull(),
  stripePaymentStatus: text("stripe_payment_status").notNull().default("pending"),
  amount: text("amount").notNull(),
  verificationStatus: text("verification_status").notNull().default("pending"),
  verificationResult: text("verification_result"),
  gpuModel: text("gpu_model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// User contacts table - saved contacts for quick party selection
export const userContacts = pgTable("user_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // References auth.users(id) - the user who saved this contact
  contactUsername: text("contact_username").notNull(), // The username being saved
  nickname: text("nickname"), // Optional custom nickname for this contact
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Account verification sessions - tracks ID verification attempts
export const accountVerifications = pgTable("account_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // References auth.users(id)
  provider: text("provider").notNull(), // "stripe_identity" or "persona"
  sessionId: text("session_id").notNull().unique(), // Provider's verification session ID
  status: text("status").notNull().default("pending"), // pending, processing, verified, failed
  stripePaymentIntentId: text("stripe_payment_intent_id"), // $5 payment tracking
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, succeeded, failed
  verificationLevel: text("verification_level"), // Provider-specific level (e.g., "document", "document+selfie")
  failureReason: text("failure_reason"), // Reason for verification failure
  canRetryAt: timestamp("can_retry_at", { withTimezone: true }), // 48-hour cooldown after failure
  verifiedData: text("verified_data"), // JSON string of verified info (name, DOB, etc.) - NOT the ID images
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Contract amendments table - tracks modifications to active/paused contracts
export const contractAmendments = pgTable("contract_amendments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(), // References consent_contracts(id)
  requestedBy: text("requested_by").notNull(), // References auth.users(id)
  amendmentType: text("amendment_type").notNull(), // "add_acts", "remove_acts", "extend_duration", "shorten_duration"
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  changes: text("changes").notNull(), // JSON string of changes: { addedActs?: string[], removedActs?: string[], newEndTime?: string }
  reason: text("reason").notNull(), // Why this amendment was requested
  approvers: text("approvers").array(), // Array of userIds who approved
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  rejectedBy: text("rejected_by"), // References auth.users(id) - who rejected
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Notifications table - in-app notifications for amendment requests and approvals
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // References auth.users(id) - recipient of notification
  type: text("type").notNull(), // "amendment_requested", "amendment_approved", "amendment_rejected"
  title: text("title").notNull(), // Brief notification title
  message: text("message").notNull(), // Notification content
  relatedContractId: varchar("related_contract_id"), // References consent_contracts(id)
  relatedAmendmentId: varchar("related_amendment_id"), // References contract_amendments(id)
  isRead: text("is_read").notNull().default("false"), // "true" or "false"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ================================================================
// INSERT SCHEMAS AND TYPES
// ================================================================

export const insertUniversitySchema = createInsertSchema(universities).omit({
  id: true,
});

export const insertStateLawSchema = createInsertSchema(stateLaws).omit({
  id: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dataRetentionPolicy: z.enum(["30days", "90days", "1year", "forever"]).default("forever"),
});

export const insertConsentRecordingSchema = createInsertSchema(consentRecordings).omit({
  id: true,
  createdAt: true,
}).extend({
  encounterType: z.string().optional(),
  parties: z.array(z.string()).optional(),
});

export const insertConsentContractSchema = createInsertSchema(consentContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  encounterType: z.string().optional(),
  parties: z.array(z.string()).optional(),
  contractStartTime: z.string().optional(),
  contractDuration: z.number().optional(),
  contractEndTime: z.string().optional(),
  method: z.enum(["signature", "voice", "photo", "biometric"]).optional(),
  contractText: z.string().optional(),
  signature1: z.string().optional(),
  signature2: z.string().optional(),
  photoUrl: z.string().optional(),
  credentialId: z.string().optional(),
  credentialPublicKey: z.string().optional(),
  credentialCounter: z.string().optional(),
  credentialDeviceType: z.string().optional(),
  credentialBackedUp: z.string().optional(),
  authenticatedAt: z.string().optional(),
  verifiedAt: z.string().optional(),
  status: z.enum(["draft", "pending_approval", "active", "completed", "rejected"]).default("draft"),
  isCollaborative: z.enum(["true", "false"]).default("false"),
  intimateActs: z.string().optional(),
});

export const insertContractCollaboratorSchema = createInsertSchema(contractCollaborators).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.string().optional(), // Optional - NULL for non-PMY participants
  legalName: z.string().optional(), // Required for external participants, optional for PMY users
  contactInfo: z.string().optional(), // Optional contact info (email, phone) for external participants
  participantType: z.enum(["pmy_user", "external"]).default("pmy_user"),
  role: z.enum(["initiator", "recipient"]),
  status: z.enum(["pending", "reviewing", "approved", "rejected"]).default("pending"),
  lastViewedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  confirmedAt: z.string().optional(),
});

export const insertContractInvitationSchema = createInsertSchema(contractInvitations).omit({
  id: true,
  createdAt: true,
}).extend({
  recipientEmail: z.string().email(),
  status: z.enum(["pending", "accepted", "expired"]).default("pending"),
  expiresAt: z.string(),
  acceptedAt: z.string().optional(),
});

export const insertUniversityReportSchema = createInsertSchema(universityReports).omit({
  id: true,
  reportedAt: true,
  resolvedAt: true,
}).extend({
  status: z.enum(["pending", "reviewing", "resolved"]).default("pending"),
  reportType: z.enum(["outdated_info", "incorrect_url", "missing_info", "other"]),
});

export const insertVerificationPaymentSchema = createInsertSchema(verificationPayments).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  stripePaymentStatus: z.enum(["pending", "paid", "failed"]).default("pending"),
  verificationStatus: z.enum(["pending", "processing", "completed", "failed"]).default("pending"),
  gpuModel: z.enum(["gpt-4", "gpt-4-turbo", "gpt-4o"]),
});

export const insertUserContactSchema = createInsertSchema(userContacts).omit({
  id: true,
  createdAt: true,
}).extend({
  contactUsername: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  nickname: z.string().max(50).optional(),
});

export const insertAccountVerificationSchema = createInsertSchema(accountVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
}).extend({
  provider: z.enum(["stripe_identity", "persona"]),
  status: z.enum(["pending", "processing", "verified", "failed"]).default("pending"),
  paymentStatus: z.enum(["pending", "succeeded", "failed"]).default("pending"),
  verificationLevel: z.string().optional(),
  failureReason: z.string().optional(),
  verifiedData: z.string().optional(),
});

export const insertContractAmendmentSchema = createInsertSchema(contractAmendments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  rejectedAt: true,
}).extend({
  amendmentType: z.enum(["add_acts", "remove_acts", "extend_duration", "shorten_duration"]),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  changes: z.string(), // JSON string validated separately
  reason: z.string().min(1, "Reason is required"),
  approvers: z.array(z.string()).optional(),
  rejectedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["amendment_requested", "amendment_approved", "amendment_rejected"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  relatedContractId: z.string().optional(),
  relatedAmendmentId: z.string().optional(),
  isRead: z.enum(["true", "false"]).default("false"),
});

// API request validation schemas for collaborative contracts
export const shareContractSchema = z.object({
  recipientEmail: z.string().email("Invalid email format").optional(),
  recipientUserId: z.string().optional(),
}).refine(
  (data) => data.recipientEmail || data.recipientUserId,
  { message: "Either recipientEmail or recipientUserId must be provided" }
);

export const rejectContractSchema = z.object({
  reason: z.string().optional(),
});

// ================================================================
// TYPESCRIPT TYPES
// ================================================================

export type InsertUniversity = z.infer<typeof insertUniversitySchema>;
export type University = typeof universities.$inferSelect;

export type InsertStateLaw = z.infer<typeof insertStateLawSchema>;
export type StateLaw = typeof stateLaws.$inferSelect;

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

export type InsertConsentRecording = z.infer<typeof insertConsentRecordingSchema>;
export type ConsentRecording = typeof consentRecordings.$inferSelect;

export type InsertConsentContract = z.infer<typeof insertConsentContractSchema>;
export type ConsentContract = typeof consentContracts.$inferSelect;

export type InsertContractCollaborator = z.infer<typeof insertContractCollaboratorSchema>;
export type ContractCollaborator = typeof contractCollaborators.$inferSelect;

export type InsertContractInvitation = z.infer<typeof insertContractInvitationSchema>;
export type ContractInvitation = typeof contractInvitations.$inferSelect;

export type InsertUniversityReport = z.infer<typeof insertUniversityReportSchema>;
export type UniversityReport = typeof universityReports.$inferSelect;

export type InsertVerificationPayment = z.infer<typeof insertVerificationPaymentSchema>;
export type VerificationPayment = typeof verificationPayments.$inferSelect;

export type InsertUserContact = z.infer<typeof insertUserContactSchema>;
export type UserContact = typeof userContacts.$inferSelect;

export type InsertAccountVerification = z.infer<typeof insertAccountVerificationSchema>;
export type AccountVerification = typeof accountVerifications.$inferSelect;

export type InsertContractAmendment = z.infer<typeof insertContractAmendmentSchema>;
export type ContractAmendment = typeof contractAmendments.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
