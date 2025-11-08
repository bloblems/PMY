import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const universities = pgTable("universities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  state: text("state").notNull(),
  titleIXInfo: text("title_ix_info").notNull(),
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

export type InsertUniversity = z.infer<typeof insertUniversitySchema>;
export type University = typeof universities.$inferSelect;

export type InsertConsentRecording = z.infer<typeof insertConsentRecordingSchema>;
export type ConsentRecording = typeof consentRecordings.$inferSelect;

export type InsertConsentContract = z.infer<typeof insertConsentContractSchema>;
export type ConsentContract = typeof consentContracts.$inferSelect;
