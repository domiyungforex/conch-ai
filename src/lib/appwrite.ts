import { Client, Users, Databases } from "node-appwrite";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT  = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY  = process.env.APPWRITE_API_KEY!;

export function createAdminClient() {
  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT)
    .setKey(API_KEY);
  return { users: new Users(client), databases: new Databases(client) };
}
