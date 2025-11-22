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
  // User preferences for consent flow defaults
  defaultUniversityId: varchar("default_university_id"), // References universities(id)
  stateOfResidence: text("state_of_residence"), // 2-letter state code (e.g., "CA", "NY")
  defaultEncounterType: text("default_encounter_type"), // Default encounter type
  defaultContractDuration: integer("default_contract_duration"), // Default duration in minutes
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
  status: text("status").notNull().default("draft"), // draft, pending_approval, active, rejected
  isCollaborative: text("is_collaborative").notNull().default("false"), // "true" or "false"
  lastEditedBy: text("last_edited_by"), // References auth.users(id)
  intimateActs: text("intimate_acts"), // JSON string of intimate acts selections
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Contract collaborators table - tracks all participants in a collaborative contract
export const contractCollaborators = pgTable("contract_collaborators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(), // References consent_contracts(id)
  userId: text("user_id").notNull(), // References auth.users(id)
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

// ================================================================
// INSERT SCHEMAS AND TYPES
// ================================================================

export const insertUniversitySchema = createInsertSchema(universities).omit({
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
  status: z.enum(["draft", "pending_approval", "active", "rejected"]).default("draft"),
  isCollaborative: z.enum(["true", "false"]).default("false"),
  intimateActs: z.string().optional(),
});

export const insertContractCollaboratorSchema = createInsertSchema(contractCollaborators).omit({
  id: true,
  createdAt: true,
}).extend({
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
