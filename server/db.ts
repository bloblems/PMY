import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { neonConfig } from '@neondatabase/serverless';
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Supabase connection string (Transaction mode pooler)
// Format: postgres://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Use your Supabase connection pooler URL (Transaction mode, port 6543)",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
