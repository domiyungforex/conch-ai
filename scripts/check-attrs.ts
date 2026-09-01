import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { Client, Databases } from "node-appwrite";

const c = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);
const db = new Databases(c);
const DB_ID = process.env.APPWRITE_DATABASE_ID!;

(async () => {
  // Try to add the embedding attribute
  try {
    await db.createFloatAttribute(DB_ID, "context_objects", "embedding", false);
    console.log("✅ Created embedding attribute");
  } catch (e) {
    console.log("⚠️  embedding:", (e as any).message);
  }

  // Check what attributes exist by listing
  try {
    const attrs = await db.listAttributes(DB_ID, "context_objects");
    console.log("\nExisting context_objects attributes:");
    for (const a of attrs.attributes) {
      console.log(`  - ${a.key} (${a.type})`);
    }
  } catch (e) {
    console.log("⚠️  Could not list attributes:", (e as any).message);
  }

  try {
    const attrs = await db.listAttributes(DB_ID, "decisions");
    console.log("\nExisting decisions attributes:");
    for (const a of attrs.attributes) {
      console.log(`  - ${a.key} (${a.type})`);
    }
  } catch (e) {
    console.log("⚠️  Could not list decision attributes:", (e as any).message);
  }

  try {
    const attrs = await db.listAttributes(DB_ID, "constraints");
    console.log("\nExisting constraints attributes:");
    for (const a of attrs.attributes) {
      console.log(`  - ${a.key} (${a.type})`);
    }
  } catch (e) {
    console.log("⚠️  Could not list constraint attributes:", (e as any).message);
  }
})();
