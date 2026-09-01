"use client";

import { Client, Account } from "appwrite";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

export const appwriteClient = new Client();
if (ENDPOINT && PROJECT) {
  appwriteClient.setEndpoint(ENDPOINT).setProject(PROJECT);
}
export const appwriteAccount = new Account(appwriteClient);
