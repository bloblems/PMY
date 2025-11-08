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

export const consentRecordings = pgTable("consent_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  fileUrl: text("file_url").notNull(),
  duration: text("duration").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const consentContracts = pgTable("consent_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractText: text("contract_text").notNull(),
  signature1: text("signature1").notNull(),
  signature2: text("signature2").notNull(),
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

export const insertUniversitySchema = createInsertSchema(universities).omit({
  id: true,
});

export const insertConsentRecordingSchema = createInsertSchema(consentRecordings).omit({
  id: true,
  createdAt: true,
});

export const insertConsentContractSchema = createInsertSchema(consentContracts).omit({
  id: true,
  createdAt: true,
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
