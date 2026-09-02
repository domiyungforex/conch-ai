/**
 * Run: npx tsx scripts/setup-challenge-collections.ts
 *
 * Creates all required Appwrite collections for the Conch Creator Challenge.
 * Requires APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY in env.
 */

import { Client, Databases, ID, Permission, Role } from "node-appwrite";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DB_ID = process.env.APPWRITE_DATABASE_ID!;

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(API_KEY);
const databases = new Databases(client);

// Helper: create collection with public read + create permissions
async function createCollection(name: string, displayName: string) {
  try {
    const col = await databases.createCollection(DB_ID, ID.unique(), displayName, [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]);
    console.log(`  ✅ Created collection: ${name} (${col.$id})`);
    return col.$id;
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || "";
    if (msg.includes("already exists")) {
      console.log(`  ⏭️  Collection ${name} already exists`);
      return null;
    }
    throw e;
  }
}

async function addStringAttr(colId: string, key: string, required = false, size = 255, defaultVal?: string) {
  try {
    await databases.createStringAttribute(DB_ID, colId, key, size, required, defaultVal ?? undefined);
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || "";
    if (!msg.includes("already exists")) console.log(`    ⚠️  ${key}: ${msg.slice(0, 80)}`);
  }
}

async function addIntAttr(colId: string, key: string, required = false, min?: number, max?: number) {
  try {
    await databases.createIntegerAttribute(DB_ID, colId, key, required, min, max);
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || "";
    if (!msg.includes("already exists")) console.log(`    ⚠️  ${key}: ${msg.slice(0, 80)}`);
  }
}

async function addBoolAttr(colId: string, key: string, required = false, defaultVal?: boolean) {
  try {
    await databases.createBooleanAttribute(DB_ID, colId, key, required, defaultVal);
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || "";
    if (!msg.includes("already exists")) console.log(`    ⚠️  ${key}: ${msg.slice(0, 80)}`);
  }
}

async function addDatetimeAttr(colId: string, key: string, required = false) {
  try {
    await databases.createDatetimeAttribute(DB_ID, colId, key, required);
  } catch (e: unknown) {
    const msg = (e as { message?: string }).message || "";
    if (!msg.includes("already exists")) console.log(`    ⚠️  ${key}: ${msg.slice(0, 80)}`);
  }
}

async function main() {
  console.log("🐚 Setting up Conch Creator Challenge collections...\n");

  // 1. Challenge Waitlist
  console.log("1. Challenge Waitlist");
  const waitlistCol = await createCollection("challenge_waitlist", "Challenge Waitlist");
  if (waitlistCol) {
    await addStringAttr(waitlistCol, "fullName", true, 255);
    await addStringAttr(waitlistCol, "email", true, 255);
    await addStringAttr(waitlistCol, "twitterHandle", false, 100);
    await addStringAttr(waitlistCol, "discordUsername", false, 100);
    await addStringAttr(waitlistCol, "role", true, 50);
    await addStringAttr(waitlistCol, "buildIdea", false, 2000);
    await addStringAttr(waitlistCol, "country", false, 100);
    await addStringAttr(waitlistCol, "referralCode", false, 50);
  }

  // 2. Challenge
  console.log("\n2. Challenge");
  const challengeCol = await createCollection("challenge", "Challenge");
  if (challengeCol) {
    await addStringAttr(challengeCol, "title", true, 255);
    await addStringAttr(challengeCol, "description", false, 2000);
    await addStringAttr(challengeCol, "phase", true, 50, "upcoming");
    await addStringAttr(challengeCol, "startDate", false, 50);
    await addStringAttr(challengeCol, "endDate", false, 50);
    await addStringAttr(challengeCol, "submissionDeadline", false, 50);
    await addStringAttr(challengeCol, "judgingStart", false, 50);
    await addStringAttr(challengeCol, "winnerAnnouncementDate", false, 50);
    await addIntAttr(challengeCol, "totalPrizeFund", false, 0);
    await addIntAttr(challengeCol, "firstPrize", false, 0);
    await addIntAttr(challengeCol, "secondPrize", false, 0);
    await addIntAttr(challengeCol, "thirdPrize", false, 0);
  }

  // 3. Challenge Participants
  console.log("\n3. Challenge Participants");
  const participantsCol = await createCollection("challenge_participants", "Challenge Participants");
  if (participantsCol) {
    await addStringAttr(participantsCol, "challengeId", true, 255);
    await addStringAttr(participantsCol, "clerkUserId", false, 255);
    await addStringAttr(participantsCol, "fullName", true, 255);
    await addStringAttr(participantsCol, "email", true, 255);
    await addStringAttr(participantsCol, "twitterHandle", false, 100);
    await addStringAttr(participantsCol, "discordUsername", false, 100);
    await addStringAttr(participantsCol, "role", true, 50);
    await addStringAttr(participantsCol, "country", false, 100);
    await addStringAttr(participantsCol, "bio", false, 2000);
    await addStringAttr(participantsCol, "avatarUrl", false, 500);
    await addStringAttr(participantsCol, "referralCode", false, 50);
  }

  // 4. Challenge Projects
  console.log("\n4. Challenge Projects");
  const projectsCol = await createCollection("challenge_projects", "Challenge Projects");
  if (projectsCol) {
    await addStringAttr(projectsCol, "challengeId", true, 255);
    await addStringAttr(projectsCol, "participantId", true, 255);
    await addStringAttr(projectsCol, "name", true, 255);
    await addStringAttr(projectsCol, "slug", true, 255);
    await addStringAttr(projectsCol, "oneLiner", false, 500);
    await addStringAttr(projectsCol, "description", false, 10000);
    await addStringAttr(projectsCol, "problemSolved", false, 5000);
    await addStringAttr(projectsCol, "conchUsage", false, 5000);
    await addStringAttr(projectsCol, "memoryImplementation", false, 5000);
    await addStringAttr(projectsCol, "agentImplementation", false, 5000);
    await addStringAttr(projectsCol, "demoUrl", false, 500);
    await addStringAttr(projectsCol, "videoUrl", false, 500);
    await addStringAttr(projectsCol, "githubUrl", false, 500);
    await addStringAttr(projectsCol, "coverImageUrl", false, 500);
    await addStringAttr(projectsCol, "status", true, 50, "idea");
    await addBoolAttr(projectsCol, "featured", false, false);
    await addStringAttr(projectsCol, "teamMembers", false, 5000);
    await addStringAttr(projectsCol, "conchFeaturesUsed", false, 2000);
  }

  // 5. Challenge Submissions
  console.log("\n5. Challenge Submissions");
  const submissionsCol = await createCollection("challenge_submissions", "Challenge Submissions");
  if (submissionsCol) {
    await addStringAttr(submissionsCol, "projectId", true, 255);
    await addStringAttr(submissionsCol, "status", true, 50, "draft");
    await addStringAttr(submissionsCol, "submittedAt", false, 50);
  }

  // 6. Challenge Winners
  console.log("\n6. Challenge Winners");
  const winnersCol = await createCollection("challenge_winners", "Challenge Winners");
  if (winnersCol) {
    await addStringAttr(winnersCol, "challengeId", true, 255);
    await addStringAttr(winnersCol, "projectId", true, 255);
    await addStringAttr(winnersCol, "participantId", true, 255);
    await addIntAttr(winnersCol, "placement", true, 1, 3);
    await addIntAttr(winnersCol, "prizeAmount", true, 0);
    await addStringAttr(winnersCol, "publishedAt", false, 50);
  }

  // 7. Challenge Events
  console.log("\n7. Challenge Events");
  const eventsCol = await createCollection("challenge_events", "Challenge Events");
  if (eventsCol) {
    await addStringAttr(eventsCol, "type", true, 100);
    await addStringAttr(eventsCol, "actorId", false, 255);
    await addStringAttr(eventsCol, "actorEmail", false, 255);
    await addStringAttr(eventsCol, "data", false, 5000);
  }

  console.log("\n✅ All challenge collections created successfully!");
  console.log("\nNote: Collections use auto-generated IDs. The collection names match what's defined in src/lib/db.ts COLLECTIONS.");
}

main().catch(console.error);
