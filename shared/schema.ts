import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
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

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  profilePictureUrl: text("profile_picture_url"),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  referralCode: text("referral_code").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at").notNull().defaultNow(),
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
  passwordHash: true,
  passwordSalt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
});

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;
