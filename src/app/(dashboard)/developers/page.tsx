import type { Metadata } from "next";
import { ApiDocsConsole } from "@/components/developers/ApiDocsConsole";

export const metadata: Metadata = {
  title: "API Reference — Conch",
  description: "Live, interactive documentation for the Conch CRUD API — Memory, Search, Chat, Agents, and Conversations.",
};

export default function DevelopersPage() {
  return <ApiDocsConsole />;
}
