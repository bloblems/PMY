import { randomUUID } from "crypto";
import {
  type University,
  type InsertUniversity,
  type ConsentRecording,
  type InsertConsentRecording,
  type ConsentContract,
  type InsertConsentContract,
  type UniversityReport,
  type InsertUniversityReport,
  type VerificationPayment,
  type InsertVerificationPayment,
  type UserProfile,
  type InsertUserProfile,
  type ContractInvitation,
  type ContractCollaborator,
} from "@shared/schema";
import { universityData } from "./university-data";
import { db } from "./db";
import {
  universities,
  consentRecordings,
  consentContracts,
  universityReports,
  verificationPayments,
  userProfiles,
  contractCollaborators,
  contractInvitations,
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { supabaseAdmin } from "./supabase";

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
  getRecordingsByUserId(userId: string): Promise<ConsentRecording[]>;
  getRecording(id: string, userId: string): Promise<ConsentRecording | undefined>;
  createRecording(recording: InsertConsentRecording): Promise<ConsentRecording>;
  deleteRecording(id: string, userId: string): Promise<boolean>;

  // Contract methods
  getContractsByUserId(userId: string): Promise<ConsentContract[]>;
  getContract(id: string, userId: string): Promise<ConsentContract | undefined>;
  createContract(contract: InsertConsentContract): Promise<ConsentContract>;
  deleteContract(id: string, userId: string): Promise<boolean>;
  updateContract(id: string, userId: string, updates: Partial<InsertConsentContract>): Promise<ConsentContract | undefined>;
  
  // Collaborative contract methods
  getDraftsByUserId(userId: string): Promise<ConsentContract[]>;
  getSharedContractsByUserId(userId: string): Promise<ConsentContract[]>;
  getPendingInAppInvitations(userId: string): Promise<Array<{ contract: ConsentContract; sender: UserProfile }>>;
  updateDraft(draftId: string, userId: string, updates: Partial<InsertConsentContract>): Promise<ConsentContract | null>;
  shareContract(contractId: string, senderId: string, senderEmail: string, recipientUserId?: string, recipientEmail?: string): Promise<{ invitationId?: string; invitationCode?: string; collaboratorId?: string }>;
  acceptInvitation(invitationCode: string, userId: string): Promise<{ contractId: string } | null>;
  getInvitationByCode(code: string): Promise<ContractInvitation | undefined>;
  getInvitationsByRecipientEmail(email: string): Promise<ContractInvitation[]>;
  hasContractAccess(contractId: string, userId: string): Promise<boolean>;
  approveContract(contractId: string, userId: string): Promise<boolean>;
  rejectContract(contractId: string, userId: string, reason?: string): Promise<boolean>;
  confirmConsent(contractId: string, userId: string): Promise<{ allPartiesConfirmed: boolean; contractStatus: string } | null>;

  // User profile methods (Supabase auth.users managed separately)
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  getAllUserProfiles(batch?: { limit: number; offset: number }): Promise<UserProfile[]>;
  searchUsersByUsername(query: string, limit?: number): Promise<UserProfile[]>;
  getUserByUsername(username: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile & { id: string }): Promise<UserProfile>;
  updateUserProfile(id: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  updateUserSignature(id: string, signature: string, signatureType: string, signatureText?: string): Promise<UserProfile | undefined>;
  updateUserRetentionPolicy(id: string, dataRetentionPolicy: string): Promise<void>;
  updateUserStripeCustomerId(id: string, stripeCustomerId: string): Promise<UserProfile | undefined>;
  deleteUserProfile(id: string): Promise<void>;
  deleteAllUserData(userId: string): Promise<void>;
  
  // User preferences methods
  getUserPreferences(id: string): Promise<{
    defaultUniversityId: string | null;
    stateOfResidence: string | null;
    defaultEncounterType: string | null;
    defaultContractDuration: number | null;
  } | undefined>;
  updateUserPreferences(id: string, updates: {
    defaultUniversityId?: string | null;
    stateOfResidence?: string | null;
    defaultEncounterType?: string | null;
    defaultContractDuration?: number | null;
  }): Promise<void>;
}

export class MemStorage implements IStorage {
  private universities: Map<string, University>;
  private recordings: Map<string, ConsentRecording>;
  private contracts: Map<string, ConsentContract>;
  private reports: Map<string, UniversityReport>;
  private verificationPayments: Map<string, VerificationPayment>;
  private userProfiles: Map<string, UserProfile>;
  private collaborators: Map<string, ContractCollaborator>;
  private invitations: Map<string, ContractInvitation>;

  constructor() {
    this.universities = new Map();
    this.recordings = new Map();
    this.contracts = new Map();
    this.reports = new Map();
    this.verificationPayments = new Map();
    this.userProfiles = new Map();
    this.collaborators = new Map();
    this.invitations = new Map();

    // Seed with initial universities
    this.seedUniversities();
  }

  private seedUniversities() {
    universityData.forEach((uni, index) => {
      const id = randomUUID();

      let titleIXInfo = "Title IX information will be populated soon. Please check your university's official website for the most current Title IX policies and procedures.";
      let titleIXUrl = null;

      if (index === 0) {
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
        verifiedAt: index === 0 ? new Date() : null,
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

  async getRecordingsByUserId(userId: string): Promise<ConsentRecording[]> {
    return Array.from(this.recordings.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecording(id: string, userId: string): Promise<ConsentRecording | undefined> {
    const recording = this.recordings.get(id);
    if (!recording || recording.userId !== userId) return undefined;
    return recording;
  }

  async deleteRecording(id: string, userId: string): Promise<boolean> {
    const recording = this.recordings.get(id);
    if (!recording || recording.userId !== userId) return false;
    return this.recordings.delete(id);
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
      contractStartTime: insertContract.contractStartTime ? new Date(insertContract.contractStartTime) : null,
      contractDuration: insertContract.contractDuration ?? null,
      contractEndTime: insertContract.contractEndTime ? new Date(insertContract.contractEndTime) : null,
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
      status: insertContract.status ?? "draft",
      isCollaborative: insertContract.isCollaborative ?? "false",
      lastEditedBy: insertContract.lastEditedBy ?? null,
      intimateActs: insertContract.intimateActs ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async getContractsByUserId(userId: string): Promise<ConsentContract[]> {
    return Array.from(this.contracts.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getContract(id: string, userId: string): Promise<ConsentContract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract || contract.userId !== userId) return undefined;
    return contract;
  }

  async deleteContract(id: string, userId: string): Promise<boolean> {
    const contract = this.contracts.get(id);
    if (!contract || contract.userId !== userId) return false;
    return this.contracts.delete(id);
  }

  async updateContract(id: string, userId: string, updates: Partial<InsertConsentContract>): Promise<ConsentContract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract || contract.userId !== userId) return undefined;
    
    const updatedData: any = { ...updates };
    if (updates.contractStartTime) updatedData.contractStartTime = new Date(updates.contractStartTime);
    if (updates.contractEndTime) updatedData.contractEndTime = new Date(updates.contractEndTime);
    if (updates.authenticatedAt) updatedData.authenticatedAt = new Date(updates.authenticatedAt);
    if (updates.verifiedAt) updatedData.verifiedAt = new Date(updates.verifiedAt);
    
    const updated: ConsentContract = {
      ...contract,
      ...updatedData,
      updatedAt: new Date(),
    };
    this.contracts.set(id, updated);
    return updated;
  }

  async getDraftsByUserId(userId: string): Promise<ConsentContract[]> {
    return Array.from(this.contracts.values())
      .filter(c => c.userId === userId && c.status === "draft")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSharedContractsByUserId(userId: string): Promise<ConsentContract[]> {
    // Find all collaborator records for this user
    const userCollaborations = Array.from(this.collaborators.values())
      .filter(c => c.userId === userId);
    
    const contractIds = userCollaborations.map(c => c.contractId);
    
    return Array.from(this.contracts.values())
      .filter(c => contractIds.includes(c.id))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPendingInAppInvitations(userId: string): Promise<Array<{ contract: ConsentContract; sender: UserProfile }>> {
    // Find pending collaborator records where user is recipient with pending status
    const pendingCollaborations = Array.from(this.collaborators.values())
      .filter(c => c.userId === userId && c.status === "pending");
    
    const results: Array<{ contract: ConsentContract; sender: UserProfile }> = [];
    
    for (const collab of pendingCollaborations) {
      const contract = this.contracts.get(collab.contractId);
      if (!contract || !contract.userId) continue;
      
      // Get sender profile (contract owner)
      const sender = this.userProfiles.get(contract.userId);
      if (!sender) continue;
      
      results.push({ contract, sender });
    }
    
    return results.sort((a, b) => b.contract.createdAt.getTime() - a.contract.createdAt.getTime());
  }

  async updateDraft(draftId: string, userId: string, updates: Partial<InsertConsentContract>): Promise<ConsentContract | null> {
    const draft = this.contracts.get(draftId);
    
    // Verify draft exists, belongs to user, and is still a draft
    if (!draft || draft.userId !== userId || draft.status !== "draft") {
      return null;
    }
    
    // Don't allow updating collaborative drafts (those should go through approval flow)
    if (draft.isCollaborative === "true") {
      return null;
    }
    
    const updatedData: any = { ...updates };
    if (updates.contractStartTime) updatedData.contractStartTime = new Date(updates.contractStartTime);
    if (updates.contractEndTime) updatedData.contractEndTime = new Date(updates.contractEndTime);
    
    const updated: ConsentContract = {
      ...draft,
      ...updatedData,
      updatedAt: new Date(),
    };
    
    this.contracts.set(draftId, updated);
    return updated;
  }

  async shareContract(contractId: string, senderId: string, senderEmail: string, recipientUserId?: string, recipientEmail?: string): Promise<{ invitationId?: string; invitationCode?: string; collaboratorId?: string }> {
    // Validate contract exists and belongs to sender
    const contract = this.contracts.get(contractId);
    if (!contract || contract.userId !== senderId) {
      throw new Error("Contract not found or unauthorized");
    }
    
    // Prevent sharing non-draft contracts
    if (contract.status !== "draft") {
      throw new Error("Only draft contracts can be shared");
    }
    
    // Validate at least one recipient is provided
    if (!recipientUserId && !recipientEmail) {
      throw new Error("Either recipientUserId or recipientEmail must be provided");
    }
    
    // Update contract to collaborative
    const updated = {
      ...contract,
      isCollaborative: "true",
      updatedAt: new Date(),
    };
    this.contracts.set(contractId, updated);
    
    // Create collaborator record for initiator if not exists (idempotent)
    const existingInitiator = Array.from(this.collaborators.values())
      .find(c => c.contractId === contractId && c.userId === senderId);
    
    if (!existingInitiator) {
      try {
        const collaboratorId = randomUUID();
        this.collaborators.set(collaboratorId, {
          id: collaboratorId,
          contractId,
          userId: senderId,
          role: "initiator",
          status: "approved",
          approvedAt: new Date(),
          lastViewedAt: new Date(),
          rejectedAt: null,
          rejectionReason: null,
          confirmedAt: null,
          createdAt: new Date(),
        });
      } catch (error) {
        // If collaborator already exists (race condition), continue anyway
        // The important part is ensuring the new recipient is added
      }
    }
    
    // PMY User Flow: Create collaborator directly (native in-app)
    if (recipientUserId) {
      // Prevent self-sharing
      if (recipientUserId === senderId) {
        throw new Error("Cannot share contract with yourself");
      }
      
      // Validate recipient user exists
      const recipientProfile = this.userProfiles.get(recipientUserId);
      if (!recipientProfile) {
        throw new Error("Recipient user not found");
      }
      
      // Check for existing collaborator (don't create duplicates)
      const existingCollaborator = Array.from(this.collaborators.values())
        .find(collab => collab.contractId === contractId && collab.userId === recipientUserId);
      if (existingCollaborator) {
        // User is already a collaborator - return existing collaborator ID
        return { collaboratorId: existingCollaborator.id };
      }
      
      // Create new collaborator entry with pending approval status
      const collaboratorId = randomUUID();
      this.collaborators.set(collaboratorId, {
        id: collaboratorId,
        contractId,
        userId: recipientUserId,
        role: "recipient",
        status: "pending",
        lastViewedAt: new Date(),
        approvedAt: null,
        rejectedAt: null,
        rejectionReason: null,
        confirmedAt: null,
        createdAt: new Date(),
      });
      
      return { collaboratorId };
    }
    
    // External Email Flow: Create email invitation (fallback for non-PMY users)
    if (recipientEmail) {
      // Prevent self-invites by comparing emails
      if (recipientEmail.toLowerCase() === senderEmail.toLowerCase()) {
        throw new Error("Cannot share contract with yourself");
      }
      
      // Check for any existing invitation to this email (regardless of status)
      const existingInvitation = Array.from(this.invitations.values())
        .find(inv => inv.contractId === contractId && inv.recipientEmail.toLowerCase() === recipientEmail.toLowerCase());
      if (existingInvitation) {
        throw new Error("An invitation has already been sent to this email");
      }
      
      const invitationId = randomUUID();
      const invitationCode = randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create invitation
      this.invitations.set(invitationId, {
        id: invitationId,
        contractId,
        senderId,
        recipientUserId: null,
        recipientEmail,
        invitationCode,
        status: "pending",
        createdAt: new Date(),
        expiresAt,
        acceptedAt: null,
      });
      
      return { invitationId, invitationCode };
    }
    
    throw new Error("Invalid share operation");
  }

  async acceptInvitation(invitationCode: string, userId: string): Promise<{ contractId: string } | null> {
    // Find invitation by code
    const invitation = Array.from(this.invitations.values())
      .find(inv => inv.invitationCode === invitationCode);
    
    if (!invitation) return null;
    
    // Check if expired
    if (new Date() > invitation.expiresAt) {
      return null;
    }
    
    // Check if already accepted
    if (invitation.status !== "pending") {
      return null;
    }
    
    // Check if user is already a collaborator (prevent duplicates)
    const existingCollaborator = Array.from(this.collaborators.values())
      .find(c => c.contractId === invitation.contractId && c.userId === userId);
    
    if (existingCollaborator) {
      // User already a collaborator, just mark invitation as accepted
      invitation.status = "accepted";
      invitation.acceptedAt = new Date();
      this.invitations.set(invitation.id, invitation);
      return { contractId: invitation.contractId };
    }
    
    // Update invitation status
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    this.invitations.set(invitation.id, invitation);
    
    // Create collaborator record
    const collaboratorId = randomUUID();
    this.collaborators.set(collaboratorId, {
      id: collaboratorId,
      contractId: invitation.contractId,
      userId,
      role: "recipient",
      status: "pending",
      lastViewedAt: new Date(),
      approvedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      confirmedAt: null,
      createdAt: new Date(),
    });
    
    // Update contract status to pending_approval
    const contract = this.contracts.get(invitation.contractId);
    if (contract) {
      const updated = {
        ...contract,
        status: "pending_approval",
        updatedAt: new Date(),
      };
      this.contracts.set(invitation.contractId, updated);
    }
    
    return { contractId: invitation.contractId };
  }

  async getInvitationByCode(code: string): Promise<ContractInvitation | undefined> {
    return Array.from(this.invitations.values())
      .find(inv => inv.invitationCode === code);
  }

  async getInvitationsByRecipientEmail(email: string): Promise<ContractInvitation[]> {
    return Array.from(this.invitations.values())
      .filter(inv => inv.recipientEmail === email);
  }

  async hasContractAccess(contractId: string, userId: string): Promise<boolean> {
    // Check if user owns the contract
    const contract = this.contracts.get(contractId);
    if (contract && contract.userId === userId) {
      return true;
    }
    
    // Check if user is a collaborator
    const isCollaborator = Array.from(this.collaborators.values())
      .some(c => c.contractId === contractId && c.userId === userId);
    
    return isCollaborator;
  }

  async approveContract(contractId: string, userId: string): Promise<boolean> {
    // Find collaborator record
    const collaborator = Array.from(this.collaborators.values())
      .find(c => c.contractId === contractId && c.userId === userId);
    
    if (!collaborator) return false;
    
    // Check if already approved/rejected
    if (collaborator.status === "approved" || collaborator.status === "rejected") {
      return false;
    }
    
    // Update collaborator status
    collaborator.status = "approved";
    collaborator.approvedAt = new Date();
    this.collaborators.set(collaborator.id, collaborator);
    
    // Check if all collaborators have approved
    const allCollaborators = Array.from(this.collaborators.values())
      .filter(c => c.contractId === contractId);
    
    const allApproved = allCollaborators.every(c => c.status === "approved");
    
    if (allApproved) {
      // Update contract status to active
      const contract = this.contracts.get(contractId);
      if (contract) {
        const updated = {
          ...contract,
          status: "active",
          updatedAt: new Date(),
        };
        this.contracts.set(contractId, updated);
      }
    }
    
    return true;
  }

  async rejectContract(contractId: string, userId: string, reason?: string): Promise<boolean> {
    // Find collaborator record
    const collaborator = Array.from(this.collaborators.values())
      .find(c => c.contractId === contractId && c.userId === userId);
    
    if (!collaborator) return false;
    
    // Check if already approved/rejected
    if (collaborator.status === "approved" || collaborator.status === "rejected") {
      return false;
    }
    
    // Update collaborator status
    collaborator.status = "rejected";
    collaborator.rejectedAt = new Date();
    collaborator.rejectionReason = reason || null;
    this.collaborators.set(collaborator.id, collaborator);
    
    // Update contract status to rejected
    const contract = this.contracts.get(contractId);
    if (contract) {
      const updated = {
        ...contract,
        status: "rejected",
        updatedAt: new Date(),
      };
      this.contracts.set(contractId, updated);
    }
    
    return true;
  }

  async confirmConsent(contractId: string, userId: string): Promise<{ allPartiesConfirmed: boolean; contractStatus: string } | null> {
    // Find collaborator record
    const collaborator = Array.from(this.collaborators.values())
      .find(c => c.contractId === contractId && c.userId === userId);
    
    if (!collaborator) return null;
    
    // Set confirmedAt timestamp
    collaborator.confirmedAt = new Date();
    this.collaborators.set(collaborator.id, collaborator);
    
    // Check if all collaborators have confirmed
    const allCollaborators = Array.from(this.collaborators.values())
      .filter(c => c.contractId === contractId);
    
    const allConfirmed = allCollaborators.every(c => c.confirmedAt !== null && c.confirmedAt !== undefined);
    
    // If all parties confirmed, activate the contract
    if (allConfirmed) {
      const contract = this.contracts.get(contractId);
      if (contract) {
        const updated = {
          ...contract,
          status: "active",
          updatedAt: new Date(),
        };
        this.contracts.set(contractId, updated);
        
        return {
          allPartiesConfirmed: true,
          contractStatus: "active"
        };
      }
    }
    
    // Get current contract status
    const contract = this.contracts.get(contractId);
    return {
      allPartiesConfirmed: false,
      contractStatus: contract?.status || "draft"
    };
  }

  async createVerificationPayment(insertPayment: InsertVerificationPayment): Promise<VerificationPayment> {
    const id = randomUUID();
    const payment: VerificationPayment = {
      ...insertPayment,
      id,
      userId: insertPayment.userId ?? null,
      verificationResult: insertPayment.verificationResult ?? null,
      createdAt: new Date(),
      completedAt: null,
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
    if (!payment) return undefined;

    const updated: VerificationPayment = {
      ...payment,
      stripePaymentStatus,
      verificationStatus,
      verificationResult: verificationResult ?? payment.verificationResult,
      completedAt: verificationStatus === "completed" ? new Date() : payment.completedAt,
    };
    this.verificationPayments.set(id, updated);
    return updated;
  }

  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    return this.userProfiles.get(id);
  }

  async getAllUserProfiles(_batch?: { limit: number; offset: number }): Promise<UserProfile[]> {
    return Array.from(this.userProfiles.values());
  }

  async searchUsersByUsername(query: string, limit: number = 10): Promise<UserProfile[]> {
    const normalizedQuery = query.toLowerCase().replace('@', '');
    const profiles = Array.from(this.userProfiles.values())
      .filter(p => p.username.toLowerCase().includes(normalizedQuery))
      .slice(0, limit);
    return profiles;
  }

  async getUserByUsername(username: string): Promise<UserProfile | undefined> {
    const normalizedUsername = username.toLowerCase().replace('@', '');
    return Array.from(this.userProfiles.values())
      .find(p => p.username.toLowerCase() === normalizedUsername);
  }

  async createUserProfile(profile: InsertUserProfile & { id: string }): Promise<UserProfile> {
    const userProfile: UserProfile = {
      ...profile,
      username: profile.username,
      firstName: profile.firstName ?? null,
      lastName: profile.lastName ?? null,
      profilePictureUrl: profile.profilePictureUrl ?? null,
      bio: profile.bio ?? null,
      websiteUrl: profile.websiteUrl ?? null,
      savedSignature: profile.savedSignature ?? null,
      savedSignatureType: profile.savedSignatureType ?? null,
      savedSignatureText: profile.savedSignatureText ?? null,
      dataRetentionPolicy: profile.dataRetentionPolicy ?? "forever",
      stripeCustomerId: profile.stripeCustomerId ?? null,
      referralCode: profile.referralCode ?? null,
      defaultUniversityId: profile.defaultUniversityId ?? null,
      stateOfResidence: profile.stateOfResidence ?? null,
      defaultEncounterType: profile.defaultEncounterType ?? null,
      defaultContractDuration: profile.defaultContractDuration ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userProfiles.set(profile.id, userProfile);
    return userProfile;
  }

  async updateUserProfile(id: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const profile = this.userProfiles.get(id);
    if (!profile) return undefined;

    const updated: UserProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date(),
    };
    this.userProfiles.set(id, updated);
    return updated;
  }

  async updateUserSignature(id: string, signature: string, signatureType: string, signatureText?: string): Promise<UserProfile | undefined> {
    return this.updateUserProfile(id, {
      savedSignature: signature,
      savedSignatureType: signatureType,
      savedSignatureText: signatureText ?? null,
    });
  }

  async updateUserRetentionPolicy(id: string, dataRetentionPolicy: string): Promise<void> {
    await this.updateUserProfile(id, { 
      dataRetentionPolicy: dataRetentionPolicy as "30days" | "90days" | "1year" | "forever"
    });
  }

  async updateUserStripeCustomerId(id: string, stripeCustomerId: string): Promise<UserProfile | undefined> {
    return this.updateUserProfile(id, { stripeCustomerId });
  }

  async deleteUserProfile(id: string): Promise<void> {
    this.userProfiles.delete(id);
  }

  async deleteAllUserData(userId: string): Promise<void> {
    // Delete all user-related data (recordings, contracts)
    Array.from(this.recordings.values())
      .filter(r => r.userId === userId)
      .forEach(r => this.recordings.delete(r.id));

    Array.from(this.contracts.values())
      .filter(c => c.userId === userId)
      .forEach(c => this.contracts.delete(c.id));

    Array.from(this.verificationPayments.values())
      .filter(p => p.userId === userId)
      .forEach(p => this.verificationPayments.delete(p.id));

    this.userProfiles.delete(userId);
  }

  async getUserPreferences(id: string) {
    const profile = await this.getUserProfile(id);
    if (!profile) return undefined;
    
    return {
      defaultUniversityId: profile.defaultUniversityId ?? null,
      stateOfResidence: profile.stateOfResidence ?? null,
      defaultEncounterType: profile.defaultEncounterType ?? null,
      defaultContractDuration: profile.defaultContractDuration ?? null,
    };
  }

  async updateUserPreferences(id: string, updates: {
    defaultUniversityId?: string | null;
    stateOfResidence?: string | null;
    defaultEncounterType?: string | null;
    defaultContractDuration?: number | null;
  }): Promise<void> {
    await this.updateUserProfile(id, updates);
  }
}

// Database storage implementation
export class DbStorage implements IStorage {
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
    const updates: any = {
      titleIXInfo,
      lastUpdated: new Date(),
    };
    if (titleIXUrl !== undefined) {
      updates.titleIXUrl = titleIXUrl;
    }
    const result = await db
      .update(universities)
      .set(updates)
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
      .set({ status: "resolved", resolvedAt: new Date() })
      .where(eq(universityReports.id, id))
      .returning();
    return result[0];
  }

  async createRecording(insertRecording: InsertConsentRecording): Promise<ConsentRecording> {
    const result = await db.insert(consentRecordings).values(insertRecording).returning();
    return result[0];
  }

  async getRecordingsByUserId(userId: string): Promise<ConsentRecording[]> {
    return await db
      .select()
      .from(consentRecordings)
      .where(eq(consentRecordings.userId, userId))
      .orderBy(desc(consentRecordings.createdAt));
  }

  async getRecording(id: string, userId: string): Promise<ConsentRecording | undefined> {
    const result = await db
      .select()
      .from(consentRecordings)
      .where(and(eq(consentRecordings.id, id), eq(consentRecordings.userId, userId)));
    return result[0];
  }

  async deleteRecording(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(consentRecordings)
      .where(and(eq(consentRecordings.id, id), eq(consentRecordings.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async createContract(insertContract: InsertConsentContract): Promise<ConsentContract> {
    const contractData: any = {
      ...insertContract,
      contractStartTime: insertContract.contractStartTime ? new Date(insertContract.contractStartTime) : null,
      contractEndTime: insertContract.contractEndTime ? new Date(insertContract.contractEndTime) : null,
      authenticatedAt: insertContract.authenticatedAt ? new Date(insertContract.authenticatedAt) : null,
      verifiedAt: insertContract.verifiedAt ? new Date(insertContract.verifiedAt) : null,
    };
    const result = await db.insert(consentContracts).values(contractData).returning();
    return result[0];
  }

  async getContractsByUserId(userId: string): Promise<ConsentContract[]> {
    return await db
      .select()
      .from(consentContracts)
      .where(eq(consentContracts.userId, userId))
      .orderBy(desc(consentContracts.createdAt));
  }

  async getContract(id: string, userId: string): Promise<ConsentContract | undefined> {
    const result = await db
      .select()
      .from(consentContracts)
      .where(and(eq(consentContracts.id, id), eq(consentContracts.userId, userId)));
    return result[0];
  }

  async deleteContract(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(consentContracts)
      .where(and(eq(consentContracts.id, id), eq(consentContracts.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async updateContract(id: string, userId: string, updates: Partial<InsertConsentContract>): Promise<ConsentContract | undefined> {
    const updatedData: any = { ...updates };
    if (updates.contractStartTime) updatedData.contractStartTime = new Date(updates.contractStartTime);
    if (updates.contractEndTime) updatedData.contractEndTime = new Date(updates.contractEndTime);
    if (updates.authenticatedAt) updatedData.authenticatedAt = new Date(updates.authenticatedAt);
    if (updates.verifiedAt) updatedData.verifiedAt = new Date(updates.verifiedAt);
    
    const result = await db
      .update(consentContracts)
      .set({ ...updatedData, updatedAt: new Date() })
      .where(and(eq(consentContracts.id, id), eq(consentContracts.userId, userId)))
      .returning();
    return result[0];
  }

  async getDraftsByUserId(userId: string): Promise<ConsentContract[]> {
    return await db
      .select()
      .from(consentContracts)
      .where(and(eq(consentContracts.userId, userId), eq(consentContracts.status, "draft")))
      .orderBy(desc(consentContracts.createdAt));
  }

  async getSharedContractsByUserId(userId: string): Promise<ConsentContract[]> {
    // Get contracts where user is a collaborator
    const collaboratorContracts = await db
      .select({ contractId: contractCollaborators.contractId })
      .from(contractCollaborators)
      .where(eq(contractCollaborators.userId, userId));
    
    const contractIds = collaboratorContracts.map(c => c.contractId);
    if (contractIds.length === 0) return [];
    
    return await db
      .select()
      .from(consentContracts)
      .where(sql`${consentContracts.id} = ANY(${contractIds})`)
      .orderBy(desc(consentContracts.createdAt));
  }

  async getPendingInAppInvitations(userId: string): Promise<Array<{ contract: ConsentContract; sender: UserProfile }>> {
    // Get pending collaborator records where user is recipient with pending status
    const pendingCollaborators = await db
      .select()
      .from(contractCollaborators)
      .where(and(
        eq(contractCollaborators.userId, userId),
        eq(contractCollaborators.status, "pending")
      ));
    
    if (pendingCollaborators.length === 0) return [];
    
    const results: Array<{ contract: ConsentContract; sender: UserProfile }> = [];
    
    for (const collab of pendingCollaborators) {
      // Get contract
      const contracts = await db
        .select()
        .from(consentContracts)
        .where(eq(consentContracts.id, collab.contractId));
      
      if (contracts.length === 0) continue;
      const contract = contracts[0];
      
      // Skip if contract has no userId (shouldn't happen but safety check)
      if (!contract.userId) continue;
      
      // Get sender profile (contract owner)
      const senders = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.id, contract.userId));
      
      if (senders.length === 0) continue;
      const sender = senders[0];
      
      results.push({ contract, sender });
    }
    
    return results.sort((a, b) => b.contract.createdAt.getTime() - a.contract.createdAt.getTime());
  }

  async updateDraft(draftId: string, userId: string, updates: Partial<InsertConsentContract>): Promise<ConsentContract | null> {
    const updatedData: any = { ...updates };
    if (updates.contractStartTime) updatedData.contractStartTime = new Date(updates.contractStartTime);
    if (updates.contractEndTime) updatedData.contractEndTime = new Date(updates.contractEndTime);
    
    // Update draft only if it belongs to user, is still a draft, and is not collaborative
    const result = await db
      .update(consentContracts)
      .set({ ...updatedData, updatedAt: new Date() })
      .where(and(
        eq(consentContracts.id, draftId),
        eq(consentContracts.userId, userId),
        eq(consentContracts.status, "draft"),
        eq(consentContracts.isCollaborative, "false")
      ))
      .returning();
    
    return result[0] || null;
  }

  async shareContract(contractId: string, senderId: string, senderEmail: string, recipientUserId?: string, recipientEmail?: string): Promise<{ invitationId?: string; invitationCode?: string; collaboratorId?: string }> {
    // Validate at least one recipient is provided
    if (!recipientUserId && !recipientEmail) {
      throw new Error("Either recipientUserId or recipientEmail must be provided");
    }
    
    // Use transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Validate contract exists and belongs to sender
      const contract = await tx
        .select()
        .from(consentContracts)
        .where(and(eq(consentContracts.id, contractId), eq(consentContracts.userId, senderId)));
      
      if (contract.length === 0) {
        throw new Error("Contract not found or unauthorized");
      }
      
      // Prevent sharing non-draft contracts
      if (contract[0].status !== "draft") {
        throw new Error("Only draft contracts can be shared");
      }
      
      // Update contract to collaborative
      await tx
        .update(consentContracts)
        .set({ isCollaborative: "true", updatedAt: new Date() })
        .where(eq(consentContracts.id, contractId));
      
      // Create collaborator record for initiator if not exists (idempotent)
      try {
        await tx.insert(contractCollaborators).values({
          userId: senderId,
          contractId,
          role: "initiator",
          status: "approved",
          approvedAt: new Date(),
          lastViewedAt: new Date(),
        });
      } catch (error: unknown) {
        // If unique constraint violated (collaborator already exists), continue anyway
        // This can happen if contract was previously shared
        // The important part is ensuring the new recipient is added below
        if (error instanceof Error && !(error.message.includes("unique") || error.message.includes("duplicate"))) {
          throw error; // Re-throw non-duplicate errors
        }
      }
      
      // PMY User Flow: Create collaborator directly (native in-app)
      if (recipientUserId) {
        // Prevent self-sharing
        if (recipientUserId === senderId) {
          throw new Error("Cannot share contract with yourself");
        }
        
        // Validate recipient user exists
        const recipientProfile = await tx
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.id, recipientUserId));
        
        if (recipientProfile.length === 0) {
          throw new Error("Recipient user not found");
        }
        
        // Check for existing collaborator (don't create duplicates)
        const existingCollaborator = await tx
          .select()
          .from(contractCollaborators)
          .where(and(
            eq(contractCollaborators.contractId, contractId),
            eq(contractCollaborators.userId, recipientUserId)
          ));
        
        if (existingCollaborator.length > 0) {
          // User is already a collaborator - return existing collaborator ID
          return { collaboratorId: existingCollaborator[0].id };
        }
        
        // Create new collaborator entry with pending approval status
        const collaborator = await tx.insert(contractCollaborators).values({
          userId: recipientUserId,
          contractId,
          role: "recipient",
          status: "pending",
          lastViewedAt: new Date(),
        }).returning();
        
        return { collaboratorId: collaborator[0].id };
      }
      
      // External Email Flow: Create email invitation (fallback for non-PMY users)
      if (recipientEmail) {
        // Prevent self-invites by comparing emails
        if (recipientEmail.toLowerCase() === senderEmail.toLowerCase()) {
          throw new Error("Cannot share contract with yourself");
        }
        
        // Check for any existing invitation to this email (regardless of status)
        const existingInvitation = await tx
          .select()
          .from(contractInvitations)
          .where(and(
            eq(contractInvitations.contractId, contractId),
            sql`LOWER(${contractInvitations.recipientEmail}) = LOWER(${recipientEmail})`
          ));
        
        if (existingInvitation.length > 0) {
          throw new Error("An invitation has already been sent to this email");
        }
        
        const invitationCode = randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
        
        // Create invitation
        const invitation = await tx.insert(contractInvitations).values({
          contractId,
          senderId,
          recipientEmail,
          invitationCode,
          expiresAt,
        }).returning();
        
        return { invitationId: invitation[0].id, invitationCode };
      }
      
      throw new Error("Invalid share operation");
    });
  }

  async acceptInvitation(invitationCode: string, userId: string): Promise<{ contractId: string } | null> {
    // Use transaction to prevent race conditions
    return await db.transaction(async (tx) => {
      // Find and lock invitation (prevent concurrent acceptance)
      const invitations = await tx
        .select()
        .from(contractInvitations)
        .where(and(
          eq(contractInvitations.invitationCode, invitationCode),
          eq(contractInvitations.status, "pending") // Row-level guard
        ));
      
      if (invitations.length === 0) return null;
      const invitation = invitations[0];
      
      // Check if expired
      if (new Date() > invitation.expiresAt) {
        return null;
      }
      
      // Check if user is already a collaborator (prevent duplicates)
      const existingCollaborator = await tx
        .select()
        .from(contractCollaborators)
        .where(and(
          eq(contractCollaborators.contractId, invitation.contractId),
          eq(contractCollaborators.userId, userId)
        ));
      
      if (existingCollaborator.length > 0) {
        // User already a collaborator, just mark invitation as accepted
        await tx
          .update(contractInvitations)
          .set({ status: "accepted", acceptedAt: new Date() })
          .where(eq(contractInvitations.id, invitation.id));
        return { contractId: invitation.contractId };
      }
      
      // Update invitation status (will fail if status changed)
      const updated = await tx
        .update(contractInvitations)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(and(
          eq(contractInvitations.id, invitation.id),
          eq(contractInvitations.status, "pending") // Prevent double-acceptance
        ))
        .returning();
      
      if (updated.length === 0) return null; // Already accepted
      
      // Create collaborator record
      await tx.insert(contractCollaborators).values({
        userId,
        contractId: invitation.contractId,
        role: "recipient",
        status: "pending",
        lastViewedAt: new Date(),
      });
      
      // Update contract status to pending_approval
      await tx
        .update(consentContracts)
        .set({ status: "pending_approval", updatedAt: new Date() })
        .where(eq(consentContracts.id, invitation.contractId));
      
      return { contractId: invitation.contractId };
    });
  }

  async getInvitationByCode(code: string): Promise<ContractInvitation | undefined> {
    const result = await db
      .select()
      .from(contractInvitations)
      .where(eq(contractInvitations.invitationCode, code));
    return result[0];
  }

  async getInvitationsByRecipientEmail(email: string): Promise<ContractInvitation[]> {
    const result = await db
      .select()
      .from(contractInvitations)
      .where(eq(contractInvitations.recipientEmail, email));
    return result;
  }

  async hasContractAccess(contractId: string, userId: string): Promise<boolean> {
    // Check if user owns the contract OR is a collaborator (single efficient query)
    const contract = await db
      .select({ userId: consentContracts.userId })
      .from(consentContracts)
      .where(eq(consentContracts.id, contractId))
      .limit(1);
    
    if (contract.length > 0 && contract[0].userId === userId) {
      return true;
    }
    
    // Check if user is a collaborator
    const collaborator = await db
      .select({ id: contractCollaborators.id })
      .from(contractCollaborators)
      .where(and(
        eq(contractCollaborators.contractId, contractId),
        eq(contractCollaborators.userId, userId)
      ))
      .limit(1);
    
    return collaborator.length > 0;
  }

  async approveContract(contractId: string, userId: string): Promise<boolean> {
    // Use transaction to prevent race conditions during approval
    return await db.transaction(async (tx) => {
      // Find collaborator record with row-level guard
      const collaborators = await tx
        .select()
        .from(contractCollaborators)
        .where(and(
          eq(contractCollaborators.contractId, contractId),
          eq(contractCollaborators.userId, userId),
          eq(contractCollaborators.status, "pending") // Row-level guard
        ));
      
      if (collaborators.length === 0) return false;
      const collaborator = collaborators[0];
      
      // Update collaborator status with guard to prevent double-approval
      const updated = await tx
        .update(contractCollaborators)
        .set({ status: "approved", approvedAt: new Date() })
        .where(and(
          eq(contractCollaborators.id, collaborator.id),
          eq(contractCollaborators.status, "pending") // Prevent double-approval
        ))
        .returning();
      
      if (updated.length === 0) return false; // Already approved or rejected
      
      // Check if all collaborators have approved
      const allCollaborators = await tx
        .select()
        .from(contractCollaborators)
        .where(eq(contractCollaborators.contractId, contractId));
      
      const allApproved = allCollaborators.every(c => c.status === "approved");
      
      if (allApproved) {
        // Update contract status to active
        await tx
          .update(consentContracts)
          .set({ status: "active", updatedAt: new Date() })
          .where(eq(consentContracts.id, contractId));
      }
      
      return true;
    });
  }

  async rejectContract(contractId: string, userId: string, reason?: string): Promise<boolean> {
    // Use transaction to prevent race conditions during rejection
    return await db.transaction(async (tx) => {
      // Find collaborator record with row-level guard
      const collaborators = await tx
        .select()
        .from(contractCollaborators)
        .where(and(
          eq(contractCollaborators.contractId, contractId),
          eq(contractCollaborators.userId, userId),
          eq(contractCollaborators.status, "pending") // Row-level guard
        ));
      
      if (collaborators.length === 0) return false;
      const collaborator = collaborators[0];
      
      // Update collaborator status with guard to prevent double-rejection
      const updated = await tx
        .update(contractCollaborators)
        .set({ 
          status: "rejected", 
          rejectedAt: new Date(),
          rejectionReason: reason || null,
        })
        .where(and(
          eq(contractCollaborators.id, collaborator.id),
          eq(contractCollaborators.status, "pending") // Prevent double-rejection
        ))
        .returning();
      
      if (updated.length === 0) return false; // Already approved or rejected
      
      // Update contract status to rejected
      await tx
        .update(consentContracts)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(consentContracts.id, contractId));
      
      return true;
    });
  }

  async confirmConsent(contractId: string, userId: string): Promise<{ allPartiesConfirmed: boolean; contractStatus: string } | null> {
    return await db.transaction(async (tx) => {
      // Find collaborator record
      const collaborators = await tx
        .select()
        .from(contractCollaborators)
        .where(and(
          eq(contractCollaborators.contractId, contractId),
          eq(contractCollaborators.userId, userId)
        ));
      
      if (collaborators.length === 0) return null;
      const collaborator = collaborators[0];
      
      // Update confirmedAt timestamp (idempotent - can be called multiple times)
      await tx
        .update(contractCollaborators)
        .set({ confirmedAt: new Date() })
        .where(eq(contractCollaborators.id, collaborator.id));
      
      // Check if all collaborators have confirmed
      const allCollaborators = await tx
        .select()
        .from(contractCollaborators)
        .where(eq(contractCollaborators.contractId, contractId));
      
      const allConfirmed = allCollaborators.every(c => c.confirmedAt !== null);
      
      // If all parties confirmed, activate the contract
      if (allConfirmed) {
        await tx
          .update(consentContracts)
          .set({ status: "active", updatedAt: new Date() })
          .where(eq(consentContracts.id, contractId));
        
        return {
          allPartiesConfirmed: true,
          contractStatus: "active"
        };
      }
      
      // Get current contract status
      const contracts = await tx
        .select({ status: consentContracts.status })
        .from(consentContracts)
        .where(eq(consentContracts.id, contractId))
        .limit(1);
      
      return {
        allPartiesConfirmed: false,
        contractStatus: contracts[0]?.status || "draft"
      };
    });
  }

  async createVerificationPayment(insertPayment: InsertVerificationPayment): Promise<VerificationPayment> {
    const result = await db.insert(verificationPayments).values(insertPayment).returning();
    return result[0];
  }

  async getVerificationPayment(id: string): Promise<VerificationPayment | undefined> {
    const result = await db.select().from(verificationPayments).where(eq(verificationPayments.id, id));
    return result[0];
  }

  async getVerificationPaymentBySessionId(sessionId: string): Promise<VerificationPayment | undefined> {
    const result = await db
      .select()
      .from(verificationPayments)
      .where(eq(verificationPayments.stripeSessionId, sessionId));
    return result[0];
  }

  async updateVerificationPaymentStatus(
    id: string,
    stripePaymentStatus: string,
    verificationStatus: string,
    verificationResult?: string
  ): Promise<VerificationPayment | undefined> {
    const updates: any = {
      stripePaymentStatus,
      verificationStatus,
    };
    if (verificationResult) {
      updates.verificationResult = verificationResult;
    }
    if (verificationStatus === "completed") {
      updates.completedAt = new Date();
    }
    const result = await db
      .update(verificationPayments)
      .set(updates)
      .where(eq(verificationPayments.id, id))
      .returning();
    return result[0];
  }

  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    const result = await db.select().from(userProfiles).where(eq(userProfiles.id, id));
    return result[0];
  }

  async getAllUserProfiles(batch?: { limit: number; offset: number }): Promise<UserProfile[]> {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at')
      .range(batch?.offset ?? 0, (batch?.offset ?? 0) + (batch?.limit ?? 1000) - 1);
    if (error) throw error;
    return data || [];
  }

  async searchUsersByUsername(query: string, limit: number = 10): Promise<UserProfile[]> {
    const normalizedQuery = query.toLowerCase().replace('@', '');
    const result = await db
      .select()
      .from(userProfiles)
      .where(sql`LOWER(${userProfiles.username}) LIKE ${`%${normalizedQuery}%`}`)
      .limit(limit);
    return result;
  }

  async getUserByUsername(username: string): Promise<UserProfile | undefined> {
    const normalizedUsername = username.toLowerCase().replace('@', '');
    const result = await db
      .select()
      .from(userProfiles)
      .where(sql`LOWER(${userProfiles.username}) = ${normalizedUsername}`)
      .limit(1);
    return result[0];
  }

  async createUserProfile(profile: InsertUserProfile & { id: string }): Promise<UserProfile> {
    const result = await db.insert(userProfiles).values(profile).returning();
    return result[0];
  }

  async updateUserProfile(id: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const result = await db
      .update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.id, id))
      .returning();
    return result[0];
  }

  async updateUserSignature(id: string, signature: string, signatureType: string, signatureText?: string): Promise<UserProfile | undefined> {
    return this.updateUserProfile(id, {
      savedSignature: signature,
      savedSignatureType: signatureType,
      savedSignatureText: signatureText,
    });
  }

  async updateUserRetentionPolicy(id: string, dataRetentionPolicy: string): Promise<void> {
    await db
      .update(userProfiles)
      .set({ dataRetentionPolicy, updatedAt: new Date() })
      .where(eq(userProfiles.id, id));
  }

  async updateUserStripeCustomerId(id: string, stripeCustomerId: string): Promise<UserProfile | undefined> {
    return this.updateUserProfile(id, { stripeCustomerId });
  }

  async deleteUserProfile(id: string): Promise<void> {
    await db.delete(userProfiles).where(eq(userProfiles.id, id));
  }

  async deleteAllUserData(userId: string): Promise<void> {
    // Delete all user-related data (cascading deletes handled by database)
    await db.delete(consentRecordings).where(eq(consentRecordings.userId, userId));
    await db.delete(consentContracts).where(eq(consentContracts.userId, userId));
    await db.delete(verificationPayments).where(eq(verificationPayments.userId, userId));
    await db.delete(userProfiles).where(eq(userProfiles.id, userId));
  }

  async getUserPreferences(id: string) {
    const profile = await this.getUserProfile(id);
    if (!profile) return undefined;
    
    return {
      defaultUniversityId: profile.defaultUniversityId ?? null,
      stateOfResidence: profile.stateOfResidence ?? null,
      defaultEncounterType: profile.defaultEncounterType ?? null,
      defaultContractDuration: profile.defaultContractDuration ?? null,
    };
  }

  async updateUserPreferences(id: string, updates: {
    defaultUniversityId?: string | null;
    stateOfResidence?: string | null;
    defaultEncounterType?: string | null;
    defaultContractDuration?: number | null;
  }): Promise<void> {
    await this.updateUserProfile(id, updates);
  }
}

// Export storage instance
const storage: IStorage = process.env.NODE_ENV === "test" ? new MemStorage() : new DbStorage();
export default storage;
