import type { ModuleKey } from "./modules";

// Every agent "personality" the platform is meant to eventually support.
// Only a subset can be created today — the rest require their owning
// module to be enabled for the requesting user (see AGENT_TYPE_MODULE).
export const AGENT_TYPES = [
  "personal",
  "research",
  "coding",
  "business",
  "financial",
  "economic",
  "operations",
  "marketing",
  "data",
] as const;

export type AgentType = (typeof AGENT_TYPES)[number];

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  personal: "Personal",
  research: "Research",
  coding: "Coding",
  business: "Business",
  financial: "Financial",
  economic: "Economic Intelligence",
  operations: "Operations",
  marketing: "Marketing",
  data: "Data",
};

// Types absent from this map are always creatable — they're part of the
// active foundation (personal, research, coding all ride on Personal AI /
// Developer AI, both always-on).
export const AGENT_TYPE_MODULE: Partial<Record<AgentType, ModuleKey>> = {
  business: "business_ai",
  operations: "business_ai",
  marketing: "business_ai",
  financial: "financial_intelligence",
  economic: "economic_intelligence",
  data: "economic_intelligence",
};

export function requiredModuleFor(type: AgentType): ModuleKey | null {
  return AGENT_TYPE_MODULE[type] ?? null;
}
