/**
 * Run: npx tsx scripts/add-indexes.ts
 *
 * Adds database indexes on frequently queried fields for better performance.
 */

import { Client, Databases } from "node-appwrite";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);
const db = new Databases(client);
const DB_ID = process.env.APPWRITE_DATABASE_ID!;

const COLS = {
  waitlist: "6a9777f5002c873440b7",
  participants: "6a97780f002f66dac3e2",
  projects: "6a97781c0015f8c637c6",
  submissions: "6a977833002bde741d59",
  winners: "6a9778380037e4289c84",
  events: "6a9778400001dd65946d",
};

const indexes = [
  // email lookups (duplicate check)
  { col: COLS.waitlist, key: "email_idx", attr: "email" },
  { col: COLS.participants, key: "email_idx", attr: "email" },

  // slug lookups (project detail page)
  { col: COLS.projects, key: "slug_idx", attr: "slug" },

  // participantId lookups (my projects, dashboard)
  { col: COLS.projects, key: "participantId_idx", attr: "participantId" },

  // submission lookups by projectId
  { col: COLS.submissions, key: "projectId_idx", attr: "projectId" },

  // winner lookups by placement
  { col: COLS.winners, key: "placement_idx", attr: "placement" },

  // referral code lookups (builder profile page)
  { col: COLS.participants, key: "referralCode_idx", attr: "referralCode" },

  // challengeId lookups
  { col: COLS.participants, key: "challengeId_idx", attr: "challengeId" },
  { col: COLS.projects, key: "challengeId_idx", attr: "challengeId" },

  // status lookups
  { col: COLS.projects, key: "status_idx", attr: "status" },

  // event type lookups
  { col: COLS.events, key: "eventType_idx", attr: "type" },

  // publishedAt for winners
  { col: COLS.winners, key: "publishedAt_idx", attr: "publishedAt" },
];

async function main() {
  console.log("📇 Adding database indexes...\n");

  for (const idx of indexes) {
    try {
      await db.createIndex(DB_ID, idx.col, idx.key, "key", [idx.attr], ["asc"]);
      console.log("  ✅ " + idx.key);
    } catch (e: unknown) {
      const msg = (e as { message?: string }).message || "";
      if (msg.includes("already exists")) {
        console.log("  ⏭️  " + idx.key + " (exists)");
      } else {
        console.log("  ⚠️  " + idx.key + ": " + msg.slice(0, 100));
      }
    }
  }

  console.log("\n✅ Done!");
}

main().catch(console.error);
