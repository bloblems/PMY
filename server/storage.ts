import { randomUUID } from "crypto";
import { type University, type InsertUniversity, type ConsentRecording, type InsertConsentRecording, type ConsentContract, type InsertConsentContract, type UniversityReport, type InsertUniversityReport, type VerificationPayment, type InsertVerificationPayment, type User, type InsertUser, type Referral, type InsertReferral } from "@shared/schema";
import { universityData } from "./university-data";
import { db } from "./db";
import { universities, consentRecordings, consentContracts, universityReports, verificationPayments, users, referrals } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // University methods
  getAllUniversities(): Promise<University[]>;
  getUniversity(id: string): Promise<University | undefined>;
  createUniversity(university: InsertUniversity): Promise<University>;
  updateUniversityTitleIX(id: string, titleIXInfo: string, titleIXUrl?: string): Promise<University | undefined>;
  verifyUniversity(id: string): Promise<University | undefined>;

  // University report methods
  createReport(report: InsertUniversityReport): Promise<UniversityReport>;
  getAllReports(): Promise<UniversityReport[]>;
  getPendingReports(): Promise<UniversityReport[]>;
  resolveReport(id: string): Promise<UniversityReport | undefined>;

  // Verification payment methods
  createVerificationPayment(payment: InsertVerificationPayment): Promise<VerificationPayment>;
  getVerificationPayment(id: string): Promise<VerificationPayment | undefined>;
  getVerificationPaymentBySessionId(sessionId: string): Promise<VerificationPayment | undefined>;
  updateVerificationPaymentStatus(id: string, stripePaymentStatus: string, verificationStatus: string, verificationResult?: string): Promise<VerificationPayment | undefined>;

  // Recording methods
  getAllRecordings(): Promise<ConsentRecording[]>;
  getRecording(id: string): Promise<ConsentRecording | undefined>;
  createRecording(recording: InsertConsentRecording): Promise<ConsentRecording>;
  deleteRecording(id: string): Promise<void>;

  // Contract methods
  getAllContracts(): Promise<ConsentContract[]>;
  getContract(id: string): Promise<ConsentContract | undefined>;
  createContract(contract: InsertConsentContract): Promise<ConsentContract>;
  deleteContract(id: string): Promise<void>;

  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser & { passwordHash: string; passwordSalt: string }): Promise<User>;
  updateUserLastLogin(id: string): Promise<User | undefined>;
  updateUserReferralCode(id: string, referralCode: string): Promise<User | undefined>;
  updateUserSignature(id: string, signature: string, signatureType: string, signatureText?: string): Promise<User | undefined>;

  // Referral methods
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralsByUserId(userId: string): Promise<Referral[]>;
  getReferralStats(userId: string): Promise<{ total: number; completed: number; pending: number }>;
  updateReferralStatus(id: string, status: string, refereeId?: string): Promise<Referral | undefined>;
}

export class MemStorage implements IStorage {
  private universities: Map<string, University>;
  private recordings: Map<string, ConsentRecording>;
  private contracts: Map<string, ConsentContract>;
  private reports: Map<string, UniversityReport>;
  private users: Map<string, User>;
  private verificationPayments: Map<string, VerificationPayment>;
  private referrals: Map<string, Referral>;

  constructor() {
    this.universities = new Map();
    this.recordings = new Map();
    this.contracts = new Map();
    this.reports = new Map();
    this.users = new Map();
    this.verificationPayments = new Map();
    this.referrals = new Map();

    // Seed with initial universities
    this.seedUniversities();
  }

  private seedUniversities() {
    universityData.forEach((uni, index) => {
      const id = randomUUID();
      
      // Add real Title IX policy for MIT (first university) to demonstrate AI summarization
      let titleIXInfo = "Title IX information will be populated soon. Please check your university's official website for the most current Title IX policies and procedures.";
      let titleIXUrl = null;
      
      if (index === 0) { // Massachusetts Institute of Technology
        titleIXInfo = "MIT's Title IX policy requires affirmative consent for all sexual activity. Consent must be informed, voluntary, and active, meaning all parties must communicate their willingness to engage in sexual activity through clear, unambiguous words or actions. Silence or lack of resistance does not constitute consent. Consent cannot be obtained through force, threat, coercion, or intimidation. A person who is incapacitated due to alcohol, drugs, sleep, or other factors cannot give consent. Incapacitation is defined as a state where an individual lacks the physical or mental capacity to make informed, rational judgments. Past consent does not imply future consent, and consent to one form of sexual activity does not imply consent to other forms. Consent can be withdrawn at any time, and all parties must immediately cease the activity when consent is revoked. Students are encouraged to document consent through written agreements or recordings when appropriate. All students must complete annual Title IX training covering these consent requirements. The Title IX office provides confidential support and resources for students who wish to report violations or seek assistance.";
        titleIXUrl = "https://idhr.mit.edu";
      }
      
      const university: University = {
        id,
        name: uni.name,
        state: uni.state,
        titleIXInfo,
        titleIXUrl,
        lastUpdated: new Date(),
        verifiedAt: index === 0 ? new Date() : null, // Mark MIT as verified
      };
      this.universities.set(id, university);
    });
  }

  async getAllUniversities(): Promise<University[]> {
    return Array.from(this.universities.values());
  }

  async getUniversity(id: string): Promise<University | undefined> {
    return this.universities.get(id);
  }

  async createUniversity(insertUniversity: InsertUniversity): Promise<University> {
    const id = randomUUID();
    const university: University = {
      ...insertUniversity,
      titleIXUrl: insertUniversity.titleIXUrl ?? null,
      id,
      lastUpdated: new Date(),
      verifiedAt: null,
    };
    this.universities.set(id, university);
    return university;
  }

  async updateUniversityTitleIX(id: string, titleIXInfo: string, titleIXUrl?: string): Promise<University | undefined> {
    const university = this.universities.get(id);
    if (!university) return undefined;

    const updated: University = {
      ...university,
      titleIXInfo,
      titleIXUrl: titleIXUrl !== undefined ? titleIXUrl : university.titleIXUrl,
      lastUpdated: new Date(),
    };
    this.universities.set(id, updated);
    return updated;
  }

  async verifyUniversity(id: string): Promise<University | undefined> {
    const university = this.universities.get(id);
    if (!university) return undefined;

    const verified: University = {
      ...university,
      verifiedAt: new Date(),
    };
    this.universities.set(id, verified);
    return verified;
  }

  async createReport(insertReport: InsertUniversityReport): Promise<UniversityReport> {
    const id = randomUUID();
    const report: UniversityReport = {
      ...insertReport,
      id,
      reportedAt: new Date(),
      resolvedAt: null,
    };
    this.reports.set(id, report);
    return report;
  }

  async getAllReports(): Promise<UniversityReport[]> {
    return Array.from(this.reports.values()).sort((a, b) =>
      b.reportedAt.getTime() - a.reportedAt.getTime()
    );
  }

  async getPendingReports(): Promise<UniversityReport[]> {
    return Array.from(this.reports.values())
      .filter(r => r.status === "pending")
      .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  async resolveReport(id: string): Promise<UniversityReport | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const resolved: UniversityReport = {
      ...report,
      status: "resolved",
      resolvedAt: new Date(),
    };
    this.reports.set(id, resolved);
    return resolved;
  }

  async getAllRecordings(): Promise<ConsentRecording[]> {
    return Array.from(this.recordings.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getRecording(id: string): Promise<ConsentRecording | undefined> {
    return this.recordings.get(id);
  }

  async createRecording(insertRecording: InsertConsentRecording): Promise<ConsentRecording> {
    const id = randomUUID();
    const recording: ConsentRecording = {
      ...insertRecording,
      id,
      userId: insertRecording.userId ?? null,
      universityId: insertRecording.universityId ?? null,
      encounterType: insertRecording.encounterType ?? null,
      parties: insertRecording.parties ?? null,
      createdAt: new Date(),
    };
    this.recordings.set(id, recording);
    return recording;
  }

  async deleteRecording(id: string): Promise<void> {
    this.recordings.delete(id);
  }

  async getAllContracts(): Promise<ConsentContract[]> {
    return Array.from(this.contracts.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getContract(id: string): Promise<ConsentContract | undefined> {
    return this.contracts.get(id);
  }

  async createContract(insertContract: InsertConsentContract): Promise<ConsentContract> {
    const id = randomUUID();
    const contract: ConsentContract = {
      ...insertContract,
      id,
      userId: insertContract.userId ?? null,
      universityId: insertContract.universityId ?? null,
      encounterType: insertContract.encounterType ?? null,
      parties: insertContract.parties ?? null,
      method: insertContract.method ?? null,
      contractText: insertContract.contractText ?? null,
      signature1: insertContract.signature1 ?? null,
      signature2: insertContract.signature2 ?? null,
      photoUrl: insertContract.photoUrl ?? null,
      credentialId: insertContract.credentialId ?? null,
      credentialPublicKey: insertContract.credentialPublicKey ?? null,
      credentialCounter: insertContract.credentialCounter ?? null,
      credentialDeviceType: insertContract.credentialDeviceType ?? null,
      credentialBackedUp: insertContract.credentialBackedUp ?? null,
      authenticatedAt: insertContract.authenticatedAt ? new Date(insertContract.authenticatedAt) : null,
      verifiedAt: insertContract.verifiedAt ? new Date(insertContract.verifiedAt) : null,
      createdAt: new Date(),
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async deleteContract(id: string): Promise<void> {
    this.contracts.delete(id);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser & { passwordHash: string; passwordSalt: string }): Promise<User> {
    const user: User = {
      ...insertUser,
      name: insertUser.name ?? null,
      profilePictureUrl: insertUser.profilePictureUrl ?? null,
      referralCode: insertUser.referralCode ?? null,
      savedSignature: null,
      savedSignatureType: null,
      savedSignatureText: null,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUserLastLogin(id: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      user.lastLoginAt = new Date();
      this.users.set(id, user);
    }
    return user;
  }

  async updateUserReferralCode(id: string, referralCode: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updated = { ...user, referralCode };
      this.users.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.referralCode === referralCode);
  }

  async updateUserSignature(id: string, signature: string, signatureType: string, signatureText?: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updated = { 
        ...user, 
        savedSignature: signature,
        savedSignatureType: signatureType,
        savedSignatureText: signatureText || null,
      };
      this.users.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async createVerificationPayment(insertPayment: InsertVerificationPayment): Promise<VerificationPayment> {
    const id = randomUUID();
    const payment: VerificationPayment = {
      ...insertPayment,
      id,
      userId: insertPayment.userId ?? null,
      verificationResult: insertPayment.verificationResult ?? null,
      completedAt: null,
      createdAt: new Date(),
    };
    this.verificationPayments.set(id, payment);
    return payment;
  }

  async getVerificationPayment(id: string): Promise<VerificationPayment | undefined> {
    return this.verificationPayments.get(id);
  }

  async getVerificationPaymentBySessionId(sessionId: string): Promise<VerificationPayment | undefined> {
    return Array.from(this.verificationPayments.values()).find(p => p.stripeSessionId === sessionId);
  }

  async updateVerificationPaymentStatus(
    id: string,
    stripePaymentStatus: string,
    verificationStatus: string,
    verificationResult?: string
  ): Promise<VerificationPayment | undefined> {
    const payment = this.verificationPayments.get(id);
    if (payment) {
      payment.stripePaymentStatus = stripePaymentStatus;
      payment.verificationStatus = verificationStatus;
      if (verificationResult !== undefined) {
        payment.verificationResult = verificationResult;
      }
      this.verificationPayments.set(id, payment);
    }
    return payment;
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = randomUUID();
    const referral: Referral = {
      ...insertReferral,
      id,
      refereeId: insertReferral.refereeId ?? null,
      invitationMessage: insertReferral.invitationMessage ?? null,
      completedAt: null,
      createdAt: new Date(),
    };
    this.referrals.set(id, referral);
    return referral;
  }

  async getReferralsByUserId(userId: string): Promise<Referral[]> {
    return Array.from(this.referrals.values())
      .filter(r => r.referrerId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getReferralStats(userId: string): Promise<{ total: number; completed: number; pending: number }> {
    const allReferrals = await this.getReferralsByUserId(userId);
    const total = allReferrals.length;
    const completed = allReferrals.filter(r => r.status === "completed").length;
    const pending = allReferrals.filter(r => r.status === "pending").length;
    return { total, completed, pending };
  }

  async updateReferralStatus(id: string, status: string, refereeId?: string): Promise<Referral | undefined> {
    const referral = this.referrals.get(id);
    if (referral) {
      const updated = {
        ...referral,
        status,
        refereeId: refereeId || referral.refereeId,
        completedAt: status === "completed" ? new Date() : referral.completedAt,
      };
      this.referrals.set(id, updated);
      return updated;
    }
    return undefined;
  }
}

export class DbStorage implements IStorage {
  // University methods
  async getAllUniversities(): Promise<University[]> {
    return await db.select().from(universities);
  }

  async getUniversity(id: string): Promise<University | undefined> {
    const result = await db.select().from(universities).where(eq(universities.id, id));
    return result[0];
  }

  async createUniversity(insertUniversity: InsertUniversity): Promise<University> {
    const result = await db.insert(universities).values(insertUniversity).returning();
    return result[0];
  }

  async updateUniversityTitleIX(id: string, titleIXInfo: string, titleIXUrl?: string): Promise<University | undefined> {
    const values: any = {
      titleIXInfo,
      lastUpdated: new Date(),
    };
    
    if (titleIXUrl !== undefined) {
      values.titleIXUrl = titleIXUrl;
    }

    const result = await db
      .update(universities)
      .set(values)
      .where(eq(universities.id, id))
      .returning();
    
    return result[0];
  }

  async verifyUniversity(id: string): Promise<University | undefined> {
    const result = await db
      .update(universities)
      .set({ verifiedAt: new Date() })
      .where(eq(universities.id, id))
      .returning();
    
    return result[0];
  }

  // University report methods
  async createReport(insertReport: InsertUniversityReport): Promise<UniversityReport> {
    const result = await db.insert(universityReports).values(insertReport).returning();
    return result[0];
  }

  async getAllReports(): Promise<UniversityReport[]> {
    return await db.select().from(universityReports).orderBy(desc(universityReports.reportedAt));
  }

  async getPendingReports(): Promise<UniversityReport[]> {
    return await db
      .select()
      .from(universityReports)
      .where(eq(universityReports.status, "pending"))
      .orderBy(desc(universityReports.reportedAt));
  }

  async resolveReport(id: string): Promise<UniversityReport | undefined> {
    const result = await db
      .update(universityReports)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
      })
      .where(eq(universityReports.id, id))
      .returning();
    
    return result[0];
  }

  // Recording methods
  async getAllRecordings(): Promise<ConsentRecording[]> {
    return await db.select().from(consentRecordings).orderBy(desc(consentRecordings.createdAt));
  }

  async getRecording(id: string): Promise<ConsentRecording | undefined> {
    const result = await db.select().from(consentRecordings).where(eq(consentRecordings.id, id));
    return result[0];
  }

  async createRecording(insertRecording: InsertConsentRecording): Promise<ConsentRecording> {
    const result = await db.insert(consentRecordings).values(insertRecording).returning();
    return result[0];
  }

  async deleteRecording(id: string): Promise<void> {
    await db.delete(consentRecordings).where(eq(consentRecordings.id, id));
  }

  // Contract methods
  async getAllContracts(): Promise<ConsentContract[]> {
    return await db.select().from(consentContracts).orderBy(desc(consentContracts.createdAt));
  }

  async getContract(id: string): Promise<ConsentContract | undefined> {
    const result = await db.select().from(consentContracts).where(eq(consentContracts.id, id));
    return result[0];
  }

  async createContract(insertContract: InsertConsentContract): Promise<ConsentContract> {
    const values: any = { ...insertContract };
    if (insertContract.authenticatedAt) {
      values.authenticatedAt = new Date(insertContract.authenticatedAt);
    }
    if (insertContract.verifiedAt) {
      values.verifiedAt = new Date(insertContract.verifiedAt);
    }
    const result = await db.insert(consentContracts).values(values).returning();
    return result[0];
  }

  async deleteContract(id: string): Promise<void> {
    await db.delete(consentContracts).where(eq(consentContracts.id, id));
  }

  // Verification payment methods
  async createVerificationPayment(insertPayment: InsertVerificationPayment): Promise<VerificationPayment> {
    const result = await db.insert(verificationPayments).values(insertPayment).returning();
    return result[0];
  }

  async getVerificationPayment(id: string): Promise<VerificationPayment | undefined> {
    const result = await db.select().from(verificationPayments).where(eq(verificationPayments.id, id));
    return result[0];
  }

  async getVerificationPaymentBySessionId(sessionId: string): Promise<VerificationPayment | undefined> {
    const result = await db.select().from(verificationPayments).where(eq(verificationPayments.stripeSessionId, sessionId));
    return result[0];
  }

  async updateVerificationPaymentStatus(
    id: string,
    stripePaymentStatus: string,
    verificationStatus: string,
    verificationResult?: string
  ): Promise<VerificationPayment | undefined> {
    const values: any = {
      stripePaymentStatus,
      verificationStatus,
    };

    if (verificationResult !== undefined) {
      values.verificationResult = verificationResult;
    }

    if (verificationStatus === "completed" || verificationStatus === "failed") {
      values.completedAt = new Date();
    }

    const result = await db
      .update(verificationPayments)
      .set(values)
      .where(eq(verificationPayments.id, id))
      .returning();

    return result[0];
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser & { passwordHash: string; passwordSalt: string }): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserLastLogin(id: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.referralCode, referralCode));
    return result[0];
  }

  async updateUserReferralCode(id: string, referralCode: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ referralCode })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserSignature(id: string, signature: string, signatureType: string, signatureText?: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ 
        savedSignature: signature,
        savedSignatureType: signatureType,
        savedSignatureText: signatureText || null,
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Referral methods
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const result = await db.insert(referrals).values(insertReferral).returning();
    return result[0];
  }

  async getReferralsByUserId(userId: string): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.referrerId, userId)).orderBy(desc(referrals.createdAt));
  }

  async getReferralStats(userId: string): Promise<{ total: number; completed: number; pending: number }> {
    const allReferrals = await this.getReferralsByUserId(userId);
    const total = allReferrals.length;
    const completed = allReferrals.filter(r => r.status === "completed").length;
    const pending = allReferrals.filter(r => r.status === "pending").length;
    return { total, completed, pending };
  }

  async updateReferralStatus(id: string, status: string, refereeId?: string): Promise<Referral | undefined> {
    const values: any = { status };
    if (refereeId) {
      values.refereeId = refereeId;
    }
    if (status === "completed") {
      values.completedAt = new Date();
    }
    const result = await db
      .update(referrals)
      .set(values)
      .where(eq(referrals.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DbStorage();
