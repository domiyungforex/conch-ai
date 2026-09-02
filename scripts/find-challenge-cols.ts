import { Client, Databases, ID, Permission, Role } from "node-appwrite";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);
const db = new Databases(client);
const DB_ID = process.env.APPWRITE_DATABASE_ID!;

async function createCol(name: string, displayName: string) {
  try {
    const col = await db.createCollection(DB_ID, ID.unique(), displayName, [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]);
    console.log("  ✅ Created: " + displayName + " => " + col["$id"]);
    return col["$id"];
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || "";
    console.log("  ⚠️  " + displayName + ": " + msg.slice(0, 100));
    return null;
  }
}

async function attr(colId: string, fn: () => Promise<void>, label: string) {
  try {
    await fn();
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || "";
    if (!msg.includes("already exists")) console.log("    ⚠️  " + label + ": " + msg.slice(0, 80));
  }
}

async function main() {
  // List all collections
  const result = await db.listCollections(DB_ID);
  console.log("Total collections: " + result.total + "\n");

  const existing = new Set(result.collections.map((c) => c.name));

  const needed = [
    "challenge_waitlist",
    "challenge",
    "challenge_participants",
    "challenge_projects",
    "challenge_submissions",
    "challenge_winners",
    "challenge_events",
  ];

  const missing = needed.filter((n) => !existing.has(n));
  console.log("Existing challenge collections: " + needed.filter((n) => existing.has(n)).join(", ") || "none");
  console.log("Missing: " + (missing.join(", ") || "none") + "\n");

  if (missing.length === 0) {
    console.log("All challenge collections already exist!");
    // List their IDs
    for (const col of result.collections) {
      if (col.name.startsWith("challenge")) {
        console.log("  " + col.name + " => " + col["$id"]);
      }
    }
    return;
  }

  // Create missing collections
  for (const name of missing) {
    console.log("Creating " + name + "...");
    const colId = await createCol(name, name);
    if (!colId) continue;

    if (name === "challenge_waitlist") {
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "fullName", 255, true), "fullName");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "email", 255, true), "email");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "twitterHandle", 100, false), "twitterHandle");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "discordUsername", 100, false), "discordUsername");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "role", 50, true), "role");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "buildIdea", 2000, false), "buildIdea");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "country", 100, false), "country");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "referralCode", 50, false), "referralCode");
    }

    if (name === "challenge") {
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "title", 255, true), "title");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "description", 2000, false), "description");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "phase", 50, true), "phase");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "startDate", 50, false), "startDate");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "endDate", 50, false), "endDate");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "submissionDeadline", 50, false), "submissionDeadline");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "judgingStart", 50, false), "judgingStart");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "winnerAnnouncementDate", 50, false), "winnerAnnouncementDate");
      await attr(colId, () => db.createIntegerAttribute(DB_ID, colId, "totalPrizeFund", false), "totalPrizeFund");
      await attr(colId, () => db.createIntegerAttribute(DB_ID, colId, "firstPrize", false), "firstPrize");
      await attr(colId, () => db.createIntegerAttribute(DB_ID, colId, "secondPrize", false), "secondPrize");
      await attr(colId, () => db.createIntegerAttribute(DB_ID, colId, "thirdPrize", false), "thirdPrize");
    }

    if (name === "challenge_participants") {
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "challengeId", 255, true), "challengeId");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "clerkUserId", 255, false), "clerkUserId");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "fullName", 255, true), "fullName");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "email", 255, true), "email");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "twitterHandle", 100, false), "twitterHandle");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "discordUsername", 100, false), "discordUsername");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "role", 50, true), "role");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "country", 100, false), "country");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "bio", 2000, false), "bio");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "avatarUrl", 500, false), "avatarUrl");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "referralCode", 50, false), "referralCode");
    }

    if (name === "challenge_projects") {
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "challengeId", 255, true), "challengeId");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "participantId", 255, true), "participantId");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "name", 255, true), "name");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "slug", 255, true), "slug");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "oneLiner", 500, false), "oneLiner");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "description", 5000, false), "description");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "problemSolved", 5000, false), "problemSolved");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "conchUsage", 5000, false), "conchUsage");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "memoryImplementation", 5000, false), "memoryImplementation");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "agentImplementation", 5000, false), "agentImplementation");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "demoUrl", 500, false), "demoUrl");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "videoUrl", 500, false), "videoUrl");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "githubUrl", 500, false), "githubUrl");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "coverImageUrl", 500, false), "coverImageUrl");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "status", 50, true), "status");
      await attr(colId, () => db.createBooleanAttribute(DB_ID, colId, "featured", false), "featured");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "teamMembers", 2000, false), "teamMembers");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "conchFeaturesUsed", 2000, false), "conchFeaturesUsed");
    }

    if (name === "challenge_submissions") {
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "projectId", 255, true), "projectId");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "status", 50, true), "status");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "submittedAt", 50, false), "submittedAt");
    }

    if (name === "challenge_winners") {
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "challengeId", 255, true), "challengeId");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "projectId", 255, true), "projectId");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "participantId", 255, true), "participantId");
      await attr(colId, () => db.createIntegerAttribute(DB_ID, colId, "placement", true, 1, 3), "placement");
      await attr(colId, () => db.createIntegerAttribute(DB_ID, colId, "prizeAmount", true), "prizeAmount");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "publishedAt", 50, false), "publishedAt");
    }

    if (name === "challenge_events") {
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "type", 100, true), "type");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "actorId", 255, false), "actorId");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "actorEmail", 255, false), "actorEmail");
      await attr(colId, () => db.createStringAttribute(DB_ID, colId, "data", 5000, false), "data");
    }
  }

  console.log("\n✅ Done!");
}

main().catch(console.error);
