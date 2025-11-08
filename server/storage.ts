import { randomUUID } from "crypto";
import { type University, type InsertUniversity, type ConsentRecording, type InsertConsentRecording, type ConsentContract, type InsertConsentContract } from "@shared/schema";

export interface IStorage {
  // University methods
  getAllUniversities(): Promise<University[]>;
  getUniversity(id: string): Promise<University | undefined>;
  createUniversity(university: InsertUniversity): Promise<University>;

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

  constructor() {
    this.universities = new Map();
    this.recordings = new Map();
    this.contracts = new Map();

    // Seed with initial universities
    this.seedUniversities();
  }

  private seedUniversities() {
    const universities = [
      { name: "Harvard University", state: "Massachusetts", titleIXInfo: "Standard Title IX guidelines apply" },
      { name: "Stanford University", state: "California", titleIXInfo: "Standard Title IX guidelines apply" },
      { name: "Yale University", state: "Connecticut", titleIXInfo: "Standard Title IX guidelines apply" },
      { name: "Princeton University", state: "New Jersey", titleIXInfo: "Standard Title IX guidelines apply" },
      { name: "Columbia University", state: "New York", titleIXInfo: "Standard Title IX guidelines apply" },
      { name: "MIT", state: "Massachusetts", titleIXInfo: "Standard Title IX guidelines apply" },
      { name: "University of Pennsylvania", state: "Pennsylvania", titleIXInfo: "Standard Title IX guidelines apply" },
      { name: "Duke University", state: "North Carolina", titleIXInfo: "Standard Title IX guidelines apply" },
      { name: "Northwestern University", state: "Illinois", titleIXInfo: "Standard Title IX guidelines apply" },
      { name: "Cornell University", state: "New York", titleIXInfo: "Standard Title IX guidelines apply" },
    ];

    universities.forEach((uni) => {
      const id = randomUUID();
      this.universities.set(id, { ...uni, id });
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
    const university: University = { ...insertUniversity, id };
    this.universities.set(id, university);
    return university;
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
