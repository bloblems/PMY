import { db } from "./db";
import { universities } from "@shared/schema";
import { isNull, eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface UniversityTitleIXInfo {
  titleIXUrl: string;
  titleIXInfo: string;
}

async function extractTitleIXInfo(universityName: string): Promise<UniversityTitleIXInfo | null> {
  try {
    console.log(`  → Generating Title IX information for ${universityName}...`);
    
    const prompt = `You are helping populate a consent documentation app with Title IX information for universities.

For ${universityName}, provide:

1. The official Title IX office URL (try to be accurate - common patterns include:
   - https://titleix.{universityname}.edu/
   - https://{universityname}.edu/title-ix/
   - https://{universityname}.edu/equity/
   - If uncertain, use the main university website format)

2. A comprehensive 150-200 word summary covering:
   - What sexual misconduct the university prohibits (harassment, assault, etc.)
   - Key consent requirements and policies
   - How to report violations
   - Available support resources
   - Commitment to creating safe environment

Write as if you researched their actual policy. Be professional and specific to Title IX compliance.

Respond in this exact JSON format:
{
  "titleIXUrl": "https://...",
  "titleIXInfo": "Your 150-200 word summary here..."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert on Title IX policies at US universities. Provide accurate, professional summaries of university Title IX policies."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 400,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.log(`  ✗ No response from OpenAI for ${universityName}`);
      return null;
    }

    const data = JSON.parse(response);
    
    // Validate the response
    if (!data.titleIXUrl || !data.titleIXInfo) {
      console.log(`  ✗ Invalid response format for ${universityName}`);
      return null;
    }

    // Check word count (should be 150-200 words)
    const wordCount = data.titleIXInfo.split(/\s+/).length;
    console.log(`  ✓ Generated ${wordCount} words`);

    return {
      titleIXUrl: data.titleIXUrl,
      titleIXInfo: data.titleIXInfo
    };
  } catch (error) {
    console.error(`  ✗ Error for ${universityName}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function batchPopulateUniversities() {
  console.log("🚀 Starting batch population of universities with Title IX information...\n");
  
  // Get all non-verified universities
  const nonVerifiedUniversities = await db
    .select()
    .from(universities)
    .where(isNull(universities.verifiedAt));
  
  console.log(`Found ${nonVerifiedUniversities.length} non-verified universities to populate\n`);
  
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  
  for (let i = 0; i < nonVerifiedUniversities.length; i += batchSize) {
    const batch = nonVerifiedUniversities.slice(i, i + batchSize);
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(nonVerifiedUniversities.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, nonVerifiedUniversities.length)} of ${nonVerifiedUniversities.length})`);
    
    // Process batch in parallel
    const results = await Promise.allSettled(
      batch.map(async (university) => {
        const info = await extractTitleIXInfo(university.name);
        return { university, info };
      })
    );
    
    // Update database with results
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.info) {
        const { university, info } = result.value;
        try {
          await db
            .update(universities)
            .set({
              titleIXInfo: info.titleIXInfo,
              titleIXUrl: info.titleIXUrl,
              lastUpdated: new Date(),
            })
            .where(eq(universities.id, university.id));
          
          console.log(`  ✓ Updated ${university.name}`);
          successCount++;
        } catch (error) {
          console.error(`  ✗ Failed to update ${university.name}:`, error);
          failureCount++;
        }
      } else if (result.status === 'fulfilled') {
        console.log(`  ⊘ Skipped ${result.value.university.name} (no info generated)`);
        skippedCount++;
      } else {
        console.error(`  ✗ Promise rejected:`, result.reason);
        failureCount++;
      }
    }
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < nonVerifiedUniversities.length) {
      console.log("  ⏳ Waiting 2 seconds before next batch...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 Batch Processing Complete!");
  console.log("=".repeat(60));
  console.log(`✓ Successfully updated: ${successCount} universities`);
  console.log(`✗ Failed: ${failureCount} universities`);
  console.log(`⊘ Skipped: ${skippedCount} universities`);
  console.log(`📝 Total processed: ${successCount + failureCount + skippedCount} universities`);
  console.log("=".repeat(60));
  
  process.exit(0);
}

batchPopulateUniversities().catch((error) => {
  console.error("Fatal error during batch population:", error);
  process.exit(1);
});
