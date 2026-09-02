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

const COLS: Record<string, string> = {
  waitlist: "6a9777f5002c873440b7",
  participants: "6a97780f002f66dac3e2",
  projects: "6a97781c0015f8c637c6",
  submissions: "6a977833002bde741d59",
  winners: "6a9778380037e4289c84",
  events: "6a9778400001dd65946d",
};

async function main() {
  console.log("📇 Verifying indexes...\n");

  for (const [name, colId] of Object.entries(COLS)) {
    try {
      const result = await db.listIndexes(DB_ID, colId);
      console.log(name + " (" + result.total + " indexes):");
      for (const idx of result.indexes) {
        console.log("  ✅ " + idx.key + " on " + idx.attributes.join(", ") + " [" + idx.type + "]");
      }
    } catch (e: unknown) {
      console.log(name + ": " + (e as { message?: string }).message?.slice(0, 80));
    }
  }
}

main().catch(console.error);
