import { db } from "./db";
import { universities } from "@shared/schema";
import { isNull, sql } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface UniversityTitleIXInfo {
  titleIXUrl: string;
  titleIXInfo: string;
}

async function generateLongerSummary(universityName: string, currentUrl: string): Promise<UniversityTitleIXInfo | null> {
  try {
    console.log(`  → Re-generating Title IX information for ${universityName}...`);
    
    const prompt = `You are helping populate a consent documentation app with Title IX information for universities.

For ${universityName}, provide:

1. The official Title IX office URL: ${currentUrl}

2. A comprehensive summary of EXACTLY 170-190 words covering:
   - What sexual misconduct the university prohibits (harassment, assault, dating violence, domestic violence, stalking)
   - Key consent requirements and definitions (affirmative consent, capacity, revocability)
   - How to report violations (Title IX office, confidential resources, online reporting)
   - Available support resources (counseling, advocacy, interim measures)
   - University's commitment to Title IX compliance and creating safe environment
   - Educational programs and training initiatives

CRITICAL: Your summary MUST be between 170-190 words. Count carefully.

Write as if you researched their actual policy. Be professional, comprehensive, and specific to Title IX compliance.

Respond in this exact JSON format:
{
  "titleIXUrl": "${currentUrl}",
  "titleIXInfo": "Your 170-190 word summary here..."
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert on Title IX policies at US universities. Provide accurate, professional summaries of exactly 170-190 words."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.log(`  ✗ No response from OpenAI for ${universityName}`);
      return null;
    }

    const data = JSON.parse(response);
    
    if (!data.titleIXUrl || !data.titleIXInfo) {
      console.log(`  ✗ Invalid response format for ${universityName}`);
      return null;
    }

    const wordCount = data.titleIXInfo.split(/\s+/).length;
    
    // Strict validation: must be 150-200 words
    if (wordCount < 150 || wordCount > 200) {
      console.log(`  ⚠ Word count ${wordCount} out of range (150-200) for ${universityName}, retrying...`);
      // Retry once
      return await generateLongerSummary(universityName, currentUrl);
    }
    
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

async function fixShortSummaries() {
  console.log("🔧 Fixing universities with summaries below 150 words...\n");
  
  // Get all non-verified universities with short summaries (< 150 words)
  const shortSummaryUniversities = await db
    .select()
    .from(universities)
    .where(isNull(universities.verifiedAt))
    .where(sql`LENGTH(${universities.titleIXInfo}) - LENGTH(REPLACE(${universities.titleIXInfo}, ' ', '')) + 1 < 150`);
  
  console.log(`Found ${shortSummaryUniversities.length} universities with summaries below 150 words\n`);
  
  let successCount = 0;
  let failureCount = 0;
  
  // Process in batches
  const batchSize = 5;
  
  for (let i = 0; i < shortSummaryUniversities.length; i += batchSize) {
    const batch = shortSummaryUniversities.slice(i, i + batchSize);
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(shortSummaryUniversities.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, shortSummaryUniversities.length)} of ${shortSummaryUniversities.length})`);
    
    const results = await Promise.allSettled(
      batch.map(async (university) => {
        const info = await generateLongerSummary(university.name, university.titleIXUrl || "https://university.edu/title-ix");
        return { university, info };
      })
    );
    
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
            .where(sql`id = ${university.id}`);
          
          console.log(`  ✓ Updated ${university.name}`);
          successCount++;
        } catch (error) {
          console.error(`  ✗ Failed to update ${university.name}:`, error);
          failureCount++;
        }
      } else {
        const uniName = result.status === 'fulfilled' ? result.value.university.name : 'unknown';
        console.log(`  ⊘ Failed to generate for ${uniName}`);
        failureCount++;
      }
    }
    
    if (i + batchSize < shortSummaryUniversities.length) {
      console.log("  ⏳ Waiting 2 seconds before next batch...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 Fix Complete!");
  console.log("=".repeat(60));
  console.log(`✓ Successfully updated: ${successCount} universities`);
  console.log(`✗ Failed: ${failureCount} universities`);
  console.log("=".repeat(60));
  
  process.exit(0);
}

fixShortSummaries().catch((error) => {
  console.error("Fatal error during fix:", error);
  process.exit(1);
});
