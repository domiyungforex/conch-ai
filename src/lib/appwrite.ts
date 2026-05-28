import { Client, Account, Users, Databases } from "node-appwrite";
import { cookies } from "next/headers";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
export const SESSION_COOKIE = process.env.APPWRITE_SESSION_COOKIE ?? "appwrite-session";

export function createAdminClient() {
  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT)
    .setKey(API_KEY);
  return { users: new Users(client), databases: new Databases(client) };
}

export async function createSessionClient() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);

  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT);
  if (session?.value) {
    client.setSession(session.value);
  }

  return {
    account: new Account(client),
    databases: new Databases(client),
    sessionValue: session?.value ?? null,
  };
}

export async function auth(): Promise<{ userId: string | null }> {
  const { account, sessionValue } = await createSessionClient();
  if (!sessionValue) return { userId: null };
  try {
    const user = await account.get();
    return { userId: user.$id };
  } catch {
    return { userId: null };
  }
}

export async function currentUser() {
  const { account, sessionValue } = await createSessionClient();
  if (!sessionValue) return null;
  try {
    return await account.get();
  } catch {
    return null;
  }
}
