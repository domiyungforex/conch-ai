import { Client, Databases } from "node-appwrite";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);
const db = new Databases(client);

async function main() {
  const dbs = await db.list();
  console.log("Databases:", dbs.total);
  for (const d of dbs.databases) {
    console.log("\nDB:", d.name, "=>", d["$id"]);
    try {
      const cols = await db.listCollections(d["$id"]);
      for (const c of cols.collections) {
        if (c.name.includes("challenge")) {
          console.log("  ✅", c.name, "=>", c["$id"]);
        }
      }
    } catch (e) {
      console.log("  ❌ Cannot list collections:", (e as Error).message?.slice(0, 80));
    }
  }
}

main().catch(console.error);
