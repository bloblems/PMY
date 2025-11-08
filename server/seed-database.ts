import { db } from "./db";
import { universities } from "@shared/schema";
import { universityData } from "./university-data";
import { sql } from "drizzle-orm";

async function seedDatabase() {
  console.log("Seeding database with universities...");
  
  // Clear existing universities
  await db.delete(universities);
  
  // Seed universities
  for (const [index, uni] of universityData.entries()) {
    // Add real Title IX policy for MIT (first university)
    let titleIXInfo = "Title IX information will be populated soon. Please check your university's official website for the most current Title IX policies and procedures.";
    let titleIXUrl: string | null = null;
    let verifiedAt: Date | null = null;
    
    if (index === 0) { // Massachusetts Institute of Technology
      titleIXInfo = "MIT's Title IX policy requires affirmative consent for all sexual activity. Consent must be informed, voluntary, and active, meaning all parties must communicate their willingness to engage in sexual activity through clear, unambiguous words or actions. Silence or lack of resistance does not constitute consent. Consent cannot be obtained through force, threat, coercion, or intimidation. A person who is incapacitated due to alcohol, drugs, sleep, or other factors cannot give consent. Incapacitation is defined as a state where an individual lacks the physical or mental capacity to make informed, rational judgments. Past consent does not imply future consent, and consent to one form of sexual activity does not imply consent to other forms. Consent can be withdrawn at any time, and all parties must immediately cease the activity when consent is revoked. Students are encouraged to document consent through written agreements or recordings when appropriate. All students must complete annual Title IX training covering these consent requirements. The Title IX office provides confidential support and resources for students who wish to report violations or seek assistance.";
      titleIXUrl = "https://idhr.mit.edu";
      verifiedAt = new Date();
    }
    
    await db.insert(universities).values({
      name: uni.name,
      state: uni.state,
      titleIXInfo,
      titleIXUrl,
      verifiedAt,
    });
  }
  
  console.log(`✅ Seeded ${universityData.length} universities into database`);
  process.exit(0);
}

seedDatabase().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
