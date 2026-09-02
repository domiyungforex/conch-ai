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

// Map collection name -> ID (populated after listing)
const colMap: Record<string, string> = {};

async function addText(colId: string, key: string, required = false, size = 10000) {
  try {
    await db.createStringAttribute(DB_ID, colId, key, size, required);
    console.log("  ✅ " + key);
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || "";
    if (msg.includes("already exists")) console.log("  ⏭️  " + key + " exists");
    else console.log("  ⚠️  " + key + ": " + msg.slice(0, 100));
  }
}

async function addString(colId: string, key: string, required = false, size = 255, defaultVal?: string) {
  try {
    await db.createStringAttribute(DB_ID, colId, key, size, required, defaultVal);
    console.log("  ✅ " + key);
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || "";
    if (msg.includes("already exists")) console.log("  ⏭️  " + key + " exists");
    else console.log("  ⚠️  " + key + ": " + msg.slice(0, 100));
  }
}

async function addBool(colId: string, key: string, required = false, defaultVal?: boolean) {
  try {
    await db.createBooleanAttribute(DB_ID, colId, key, required, defaultVal);
    console.log("  ✅ " + key);
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || "";
    if (msg.includes("already exists")) console.log("  ⏭️  " + key + " exists");
    else console.log("  ⚠️  " + key + ": " + msg.slice(0, 100));
  }
}

async function addInt(colId: string, key: string, required = false, min?: number, max?: number) {
  try {
    await db.createIntegerAttribute(DB_ID, colId, key, required, min, max);
    console.log("  ✅ " + key);
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || "";
    if (msg.includes("already exists")) console.log("  ⏭️  " + key + " exists");
    else console.log("  ⚠️  " + key + ": " + msg.slice(0, 100));
  }
}

async function main() {
  console.log("🔍 Listing existing collections...\n");
  const result = await db.listCollections(DB_ID);
  for (const col of result.collections) {
    colMap[col.name] = col["$id"];
    console.log("  " + col.name + " => " + col["$id"]);
  }

  // Fix challenge_projects - add missing attributes
  const projectsColId = colMap["challenge_projects"];
  if (projectsColId) {
    console.log("\n📝 Adding missing Challenge Projects attributes...");
    await addText(projectsColId, "problemSolved");
    await addText(projectsColId, "conchUsage");
    await addText(projectsColId, "memoryImplementation");
    await addText(projectsColId, "agentImplementation");
    await addText(projectsColId, "teamMembers", false, 2000);
    await addText(projectsColId, "conchFeaturesUsed", false, 2000);
  }

  // Fix challenge - add phase default
  const challengeColId = colMap["challenge"];
  if (challengeColId) {
    console.log("\n📝 Fixing Challenge defaults...");
    // phase was created without default, that's fine - API handles it
  }

  console.log("\n✅ Setup complete!");
}

main().catch(console.error);
