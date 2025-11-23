/**
 * Setup Script: Create Bart - PMY's Distinguished Demo User
 * 
 * Creates @bart account with:
 * - Email: bart.simpson@pmy.demo
 * - Bio: NBA player
 * - Sample contracts (active, paused, completed, drafts)
 * - Sample recordings
 * - Sample contacts
 */

import { supabaseAdmin } from "../server/supabase";
import storage from "../server/storage";
import { randomUUID } from "crypto";

const BART_EMAIL = "bart.simpson@pmy.demo";
const BART_USERNAME = "bart";
const BART_PASSWORD = "BartPlaysNBA2024!"; // Strong password for demo

interface BartAccount {
  userId: string;
  email: string;
  username: string;
}

async function createBartAuthUser(): Promise<string> {
  console.log("\n🏀 Creating Bart's Supabase Auth account...");
  
  // Check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find(u => u.email === BART_EMAIL);
  
  if (existingUser) {
    console.log(`✅ Bart's auth account already exists (ID: ${existingUser.id})`);
    return existingUser.id;
  }
  
  // Create new auth user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: BART_EMAIL,
    password: BART_PASSWORD,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      name: "Bart Simpson"
    }
  });
  
  if (error) {
    throw new Error(`Failed to create Bart's auth account: ${error.message}`);
  }
  
  console.log(`✅ Created Bart's auth account (ID: ${data.user.id})`);
  return data.user.id;
}

async function createBartProfile(userId: string): Promise<void> {
  console.log("\n👤 Creating Bart's profile...");
  
  // Check if profile already exists
  const existingProfile = await storage.getUserProfile(userId);
  if (existingProfile) {
    console.log(`✅ Bart's profile already exists (@${existingProfile.username})`);
    return;
  }
  
  // Create profile
  await storage.createUserProfile({
    id: userId,
    username: BART_USERNAME,
    firstName: "Bart",
    lastName: "Simpson",
    bio: "NBA player",
    profilePictureUrl: null,
    websiteUrl: null,
    savedSignature: null,
    savedSignatureType: null,
    savedSignatureText: null,
    dataRetentionPolicy: "forever",
    stripeCustomerId: null,
    referralCode: `BART${randomUUID().substring(0, 8).toUpperCase()}`,
    defaultUniversityId: null,
    stateOfResidence: "CA",
    defaultEncounterType: "intimate",
    defaultContractDuration: 60,
  });
  
  console.log(`✅ Created profile for @${BART_USERNAME}`);
}

async function createBartTestData(userId: string): Promise<void> {
  console.log("\n📝 Creating Bart's test data...");
  
  // Get a sample university
  const universities = await storage.getAllUniversities();
  const sampleUniversity = universities.find(u => u.state === "CA") || universities[0];
  
  // Create sample contracts
  console.log("  Creating sample contracts...");
  
  // 1. Active contract
  const activeContract = await storage.createContract({
    userId,
    universityId: sampleUniversity?.id || null,
    encounterType: "intimate",
    parties: ["@bart", "Alex Johnson"],
    contractStartTime: new Date(),
    contractDuration: 120,
    contractEndTime: new Date(Date.now() + 120 * 60 * 1000),
    method: "signature",
    contractText: "Mutual consent for intimate encounter with clear boundaries and respect.",
    signature1: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    signature2: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    status: "active",
    intimateActs: JSON.stringify({
      kissing: "yes",
      touching: "yes",
      intercourse: "yes"
    }),
  });
  console.log(`    ✅ Active contract: ${activeContract.id}`);
  
  // 2. Paused contract
  const pausedContract = await storage.createContract({
    userId,
    universityId: sampleUniversity?.id || null,
    encounterType: "date",
    parties: ["@bart", "Jordan Lee"],
    contractStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    contractDuration: 180,
    contractEndTime: new Date(Date.now() + 60 * 60 * 1000),
    method: "signature",
    contractText: "Consensual date with mutual respect and boundaries.",
    signature1: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    signature2: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    status: "active",
    intimateActs: JSON.stringify({
      kissing: "yes",
      touching: "maybe",
      intercourse: "no"
    }),
  });
  await storage.pauseContract(pausedContract.id, userId);
  console.log(`    ✅ Paused contract: ${pausedContract.id}`);
  
  // 3. Completed contract
  const completedContract = await storage.createContract({
    userId,
    universityId: sampleUniversity?.id || null,
    encounterType: "conversation",
    parties: ["@bart", "Taylor Martinez"],
    contractStartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    contractDuration: 60,
    contractEndTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    method: "voice",
    contractText: "Consensual private conversation with boundaries.",
    status: "completed",
    intimateActs: JSON.stringify({
      kissing: "no",
      touching: "no",
      intercourse: "no"
    }),
  });
  console.log(`    ✅ Completed contract: ${completedContract.id}`);
  
  // 4. Draft contract
  const draftContract = await storage.createContract({
    userId,
    universityId: sampleUniversity?.id || null,
    encounterType: "intimate",
    parties: ["@bart", ""],
    contractStartTime: null,
    contractDuration: null,
    contractEndTime: null,
    method: null,
    contractText: null,
    status: "draft",
    intimateActs: JSON.stringify({
      kissing: "yes",
      touching: "yes",
      intercourse: "maybe"
    }),
  });
  console.log(`    ✅ Draft contract: ${draftContract.id}`);
  
  // Create sample recordings
  console.log("  Creating sample recordings...");
  
  const recording1 = await storage.createRecording({
    userId,
    universityId: sampleUniversity?.id || null,
    encounterType: "intimate",
    parties: ["@bart", "Sam Wilson"],
    filename: "consent-voice-recording.webm",
    fileUrl: "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHGTbuMU6uEElTDZ1OsggEXTbuMU6uEHFO7a1OsggG97AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmoCrXsYMPQkBNgIRMYXZmV0GETGF2ZkSJiEBEAAAAAAAAFlSua8yuAQAAAAAAAEPXgQFzxYgAAAAAAAAAAZyBACK1nIN1bmSIgQCGhVZfVlA4g4EBI+ODhAJiWgDgAQAAAAAAABKJhIABAAGJa2+Q/FOBQAAA",
    duration: "00:15",
  });
  console.log(`    ✅ Recording 1: ${recording1.id}`);
  
  const recording2 = await storage.createRecording({
    userId,
    universityId: sampleUniversity?.id || null,
    encounterType: "date",
    parties: ["@bart", "Casey Brown"],
    filename: "consent-voice-recording-2.webm",
    fileUrl: "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHGTbuMU6uEElTDZ1OsggEXTbuMU6uEHFO7a1OsggG97AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmoCrXsYMPQkBNgIRMYXZmV0GETGF2ZkSJiEBEAAAAAAAAFlSua8yuAQAAAAAAAEPXgQFzxYgAAAAAAAAAAZyBACK1nIN1bmSIgQCGhVZfVlA4g4EBI+ODhAJiWgDgAQAAAAAAABKJhIABAAGJa2+Q/FOBQAAA",
    duration: "00:12",
  });
  console.log(`    ✅ Recording 2: ${recording2.id}`);
  
  // Create sample contacts
  console.log("  Creating sample contacts...");
  
  try {
    await storage.addUserContact(userId, "lebron", "LeBron");
    console.log(`    ✅ Contact: @lebron`);
  } catch (error) {
    // Contact might not exist, that's okay
    console.log(`    ⏭️  Skipped contact @lebron (user doesn't exist)`);
  }
  
  console.log("\n✅ All test data created successfully!");
}

async function setupBart(): Promise<BartAccount> {
  console.log("\n" + "=".repeat(60));
  console.log("🏀 Setting up Bart - PMY's Distinguished Demo User");
  console.log("=".repeat(60));
  
  try {
    // Step 1: Create auth user
    const userId = await createBartAuthUser();
    
    // Step 2: Create profile
    await createBartProfile(userId);
    
    // Step 3: Create test data
    await createBartTestData(userId);
    
    const account: BartAccount = {
      userId,
      email: BART_EMAIL,
      username: BART_USERNAME,
    };
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ BART IS READY!");
    console.log("=".repeat(60));
    console.log(`\n📧 Email:    ${account.email}`);
    console.log(`👤 Username: @${account.username}`);
    console.log(`🔑 Password: ${BART_PASSWORD}`);
    console.log(`🆔 User ID:  ${account.userId}`);
    console.log("\n🏀 Bio: NBA player");
    console.log("\n📊 Test Data:");
    console.log("  • 1 Active contract");
    console.log("  • 1 Paused contract");
    console.log("  • 1 Completed contract");
    console.log("  • 1 Draft contract");
    console.log("  • 2 Voice recordings");
    console.log("\n" + "=".repeat(60));
    
    return account;
  } catch (error) {
    console.error("\n❌ Failed to set up Bart:", error);
    throw error;
  }
}

// Run the setup
setupBart().catch(console.error);
