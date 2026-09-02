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
const WAITLIST_ID = "6a9777f5002c873440b7";

async function main() {
  const result = await db.listDocuments(DB_ID, WAITLIST_ID);
  console.log("=== Waitlist Signups (" + result.total + ") ===\n");
  for (const doc of result.documents) {
    console.log("---");
    console.log("  Name:", doc.fullName);
    console.log("  Email:", doc.email);
    console.log("  Role:", doc.role);
    console.log("  Country:", doc.country || "N/A");
    console.log("  Twitter:", doc.twitterHandle || "N/A");
    console.log("  Build Idea:", doc.buildIdea || "N/A");
    console.log("  Referral Code:", doc.referralCode);
    console.log("  Joined:", doc["$createdAt"]);
  }
}

main().catch(console.error);
