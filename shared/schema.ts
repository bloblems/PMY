import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const universities = pgTable("universities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  state: text("state").notNull(),
  titleIXInfo: text("title_ix_info").notNull(),
  titleIXUrl: text("title_ix_url"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

// OIDC session storage table (required by Replit Auth)
// IMPORTANT: Do not drop this table - mandatory for OIDC authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - supports both OIDC and email/password authentication
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(), // Nullable for OIDC users without email
  name: text("name"), // Legacy field for email/password users
  firstName: text("first_name"), // OIDC field
  lastName: text("last_name"), // OIDC field
  profilePictureUrl: text("profile_picture_url"),
  passwordHash: text("password_hash"), // Nullable - only for email/password users
  passwordSalt: text("password_salt"), // Nullable - only for email/password users
  passwordResetToken: text("password_reset_token"), // Nullable - temporary reset token
  passwordResetTokenExpiry: timestamp("password_reset_token_expiry"), // Nullable - token expiration
  referralCode: text("referral_code").unique(),
  savedSignature: text("saved_signature"),
  savedSignatureType: text("saved_signature_type"),
  savedSignatureText: text("saved_signature_text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(), // Required by OIDC
  lastLoginAt: timestamp("last_login_at").notNull().defaultNow(),
  dataRetentionPolicy: text("data_retention_policy").notNull().default("forever"), // Options: "30days", "90days", "1year", "forever"
});

export const consentRecordings = pgTable("consent_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  universityId: varchar("university_id"),
  encounterType: text("encounter_type"),
  parties: text("parties").array(),
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(),
  duration: text("duration").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const consentContracts = pgTable("consent_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  universityId: varchar("university_id"),
  encounterType: text("encounter_type"),
  parties: text("parties").array(),
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
  authenticatedAt: timestamp("authenticated_at"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const universityReports = pgTable("university_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  universityId: varchar("university_id").notNull(),
  reportType: text("report_type").notNull(),
  description: text("description").notNull(),
  reportedAt: timestamp("reported_at").notNull().defaultNow(),
  status: text("status").notNull().default("pending"),
  resolvedAt: timestamp("resolved_at"),
});

export const verificationPayments = pgTable("verification_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  universityId: varchar("university_id").notNull(),
  stripeSessionId: text("stripe_session_id").notNull(),
  stripePaymentStatus: text("stripe_payment_status").notNull().default("pending"),
  amount: text("amount").notNull(),
  verificationStatus: text("verification_status").notNull().default("pending"),
  verificationResult: text("verification_result"),
  gpuModel: text("gpu_model").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: text("referrer_id").notNull(),
  refereeEmail: text("referee_email").notNull(),
  refereeId: text("referee_id"),
  status: text("status").notNull().default("pending"),
  invitationMessage: text("invitation_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertUniversitySchema = createInsertSchema(universities).omit({
  id: true,
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
}).extend({
  encounterType: z.string().optional(),
  parties: z.array(z.string()).optional(),
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
});

export const insertUniversityReportSchema = createInsertSchema(universityReports).omit({
  id: true,
  reportedAt: true,
  resolvedAt: true,
}).extend({
  status: z.enum(["pending", "reviewing", "resolved"]).default("pending"),
  reportType: z.enum(["outdated_info", "incorrect_url", "missing_info", "other"]),
});

export type InsertUniversity = z.infer<typeof insertUniversitySchema>;
export type University = typeof universities.$inferSelect;

export type InsertConsentRecording = z.infer<typeof insertConsentRecordingSchema>;
export type ConsentRecording = typeof consentRecordings.$inferSelect;

export type InsertConsentContract = z.infer<typeof insertConsentContractSchema>;
export type ConsentContract = typeof consentContracts.$inferSelect;

export type InsertUniversityReport = z.infer<typeof insertUniversityReportSchema>;
export type UniversityReport = typeof universityReports.$inferSelect;

export const insertVerificationPaymentSchema = createInsertSchema(verificationPayments).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  stripePaymentStatus: z.enum(["pending", "paid", "failed"]).default("pending"),
  verificationStatus: z.enum(["pending", "processing", "completed", "failed"]).default("pending"),
  gpuModel: z.enum(["gpt-4", "gpt-4-turbo", "gpt-4o"]),
});

export type InsertVerificationPayment = z.infer<typeof insertVerificationPaymentSchema>;
export type VerificationPayment = typeof verificationPayments.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  lastLoginAt: true,
  updatedAt: true,
  passwordHash: true,
  passwordSalt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// OIDC upsert user schema (for Replit Auth)
export const upsertUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
});

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;
