import { db } from "./db";
import { universities } from "@shared/schema";
import { universityData } from "./university-data";
import { sql, count } from "drizzle-orm";

async function seedDatabase() {
  console.log("Checking if database needs seeding...");
  
  // Check if universities already exist
  const result = await db.select({ count: count() }).from(universities);
  const universityCount = result[0]?.count ?? 0;
  
  if (universityCount > 0) {
    console.log(`✅ Database already has ${universityCount} universities. Skipping seed.`);
    process.exit(0);
  }
  
  console.log("Seeding database with universities...");
  
  // Seed universities (only runs if table is empty)
  for (const [index, uni] of universityData.entries()) {
    let titleIXInfo = "Title IX information will be populated soon. Please check your university's official website for the most current Title IX policies and procedures.";
    let titleIXUrl: string | null = null;
    let verifiedAt: Date | null = null;
    
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
