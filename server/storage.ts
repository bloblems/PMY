import { randomUUID } from "crypto";
import { type University, type InsertUniversity, type ConsentRecording, type InsertConsentRecording, type ConsentContract, type InsertConsentContract, type UniversityReport, type InsertUniversityReport } from "@shared/schema";
import { universityData } from "./university-data";

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
}

export class MemStorage implements IStorage {
  private universities: Map<string, University>;
  private recordings: Map<string, ConsentRecording>;
  private contracts: Map<string, ConsentContract>;
  private reports: Map<string, UniversityReport>;

  constructor() {
    this.universities = new Map();
    this.recordings = new Map();
    this.contracts = new Map();
    this.reports = new Map();

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
      createdAt: new Date(),
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async deleteContract(id: string): Promise<void> {
    this.contracts.delete(id);
  }
}

export const storage = new MemStorage();
