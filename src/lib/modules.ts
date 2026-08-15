// Single source of truth for every architectural module in the Conch
// platform — active and future. Feature flags, the admin control center,
// and the locked "coming soon" UX all read from this registry instead of
// hardcoding module lists in three different places.

export const MODULE_KEYS = [
  "personal_ai",
  "developer_ai",
  "memory_engine",
  "agent_system",
  "business_ai",
  "creator_ai",
  "economic_intelligence",
  "financial_intelligence",
  "opportunity_engine",
  "marketplace",
  "credit_intelligence",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export type ModuleStatus = "enabled" | "disabled" | "beta";

// Ground truth for a fresh environment with no feature_flags rows yet —
// what a brand-new deploy behaves like before anyone touches the admin
// panel. All 10 modules now have real, working pages and are enabled by
// default — this only matters for a from-scratch deploy with an empty
// feature_flags collection; the running production DB already has explicit
// rows for every module (see scripts and the admin control center).
export const DEFAULT_MODULE_STATUS: Record<ModuleKey, ModuleStatus> = {
  personal_ai: "enabled",
  developer_ai: "enabled",
  memory_engine: "enabled",
  agent_system: "enabled",
  business_ai: "enabled",
  creator_ai: "enabled",
  economic_intelligence: "enabled",
  financial_intelligence: "enabled",
  opportunity_engine: "enabled",
  marketplace: "enabled",
  credit_intelligence: "enabled",
};

// Modules with no real UI yet, shown only through a locked/"coming soon"
// surface rather than a full screen. Empty now — every module has a real
// page (Business, Financial, Opportunities, Economic, Marketplace all live
// in the sidebar). Kept as a named export so the admin control center and
// any future dormant module have somewhere to register without inventing
// a new mechanism.
export const FUTURE_MODULES: ReadonlySet<ModuleKey> = new Set([]);

export interface ModuleInfo {
  key: ModuleKey;
  label: string;
  tagline: string;
  description: string;
  activationCriteria: string[];
}

export const MODULE_REGISTRY: Record<ModuleKey, ModuleInfo> = {
  personal_ai: {
    key: "personal_ai",
    label: "Personal AI",
    tagline: "Persistent memory, preferences, and context — Conch's foundation.",
    description: "Persistent personal memory, preferences, goals, projects, conversations, and personal AI agents.",
    activationCriteria: [],
  },
  developer_ai: {
    key: "developer_ai",
    label: "Developer AI",
    tagline: "Code preview and execution, in chat.",
    description: "Code preview, syntax highlighting, and sandboxed Python execution inside chat.",
    activationCriteria: [],
  },
  memory_engine: {
    key: "memory_engine",
    label: "Memory Engine",
    tagline: "The retrieval system behind every Conch response.",
    description: "Embedding-backed semantic memory retrieval, categorization, and access control.",
    activationCriteria: [],
  },
  agent_system: {
    key: "agent_system",
    label: "Agent System",
    tagline: "Custom AI agents with their own memory scope and instructions.",
    description: "User-defined AI agents with their own system prompt, model, and memory scope.",
    activationCriteria: [],
  },
  business_ai: {
    key: "business_ai",
    label: "Business AI",
    tagline: "Business memory — every record remembered, every question answered.",
    description:
      "A business memory that Conch builds over time — customers, suppliers, products, orders, inventory, expenses, and revenue — so it can recall and answer from your own records.",
    activationCriteria: [
      "Core Conch stable",
      "Minimum active users reached",
      "Business demand validated",
      "Infrastructure capacity available",
      "Monitoring implemented",
      "Security review completed",
    ],
  },
  creator_ai: {
    key: "creator_ai",
    label: "Creator Memory",
    tagline: "Your creative memory — songs, ideas, campaigns, and collaborators.",
    description:
      "A creator memory for musicians, artists, YouTubers, writers, and producers — tracks songs, lyrics, unreleased ideas, campaigns, content, and collaborations, with an assistant that remembers your creative history.",
    activationCriteria: [],
  },
  economic_intelligence: {
    key: "economic_intelligence",
    label: "Economic Intelligence",
    tagline: "Market signals, remembered with their sources.",
    description:
      "Analysis of permitted data sources to surface market signals — every insight carries its source, timestamp, confidence, and methodology, never presented as certainty.",
    activationCriteria: [
      "Sufficient data sources",
      "Reliable data pipelines",
      "User demand",
      "Legal/compliance review",
      "Infrastructure budget",
    ],
  },
  financial_intelligence: {
    key: "financial_intelligence",
    label: "Financial Intelligence",
    tagline: "Cash flow, budgeting, and financial forecasting — remembered.",
    description: "Cash-flow analysis, budgeting, expense intelligence, and revenue forecasting through a provider-agnostic payments abstraction.",
    activationCriteria: [
      "Business AI validated first",
      "Payment provider partnerships",
      "Security & compliance review",
      "Fraud protection implemented",
    ],
  },
  opportunity_engine: {
    key: "opportunity_engine",
    label: "Opportunity Engine",
    tagline: "\"Where is the opportunity?\"",
    description:
      "Surfaces underserved markets, rising demand, and pricing opportunities from real evidence — every result includes its data sources, risk factors, and a confidence score.",
    activationCriteria: ["Economic Intelligence active", "Validated data sources", "User demand"],
  },
  marketplace: {
    key: "marketplace",
    label: "Marketplace",
    tagline: "A shared memory of businesses, suppliers, and opportunities.",
    description: "Product, supplier, business, and service discovery with AI-assisted matching.",
    activationCriteria: ["Business AI active", "Sufficient supply-side listings", "Trust & safety review"],
  },
  credit_intelligence: {
    key: "credit_intelligence",
    label: "Credit Intelligence",
    tagline: "Understand your business's financial health.",
    description:
      "An opt-in business financial profile — revenue, expense, and payment history — to help a business understand its own health and, eventually, connect with financing partners. Never an unauthorized credit score or lending decision.",
    activationCriteria: [
      "Financial Intelligence active",
      "Explicit per-business consent flow",
      "Legal review (this is regulated in most jurisdictions)",
      "Lending-partner agreements, if any",
    ],
  },
};

// Modules with their own top-level sidebar page, and where to send someone
// once they've opted into seeing it there. credit_intelligence has no entry
// here — it only ever appears embedded in a business's own detail page, not
// as its own nav destination.
export const MODULE_NAV_ITEMS: { key: ModuleKey; href: string; label: string }[] = [
  { key: "business_ai", href: "/business", label: "Business" },
  { key: "creator_ai", href: "/creators", label: "Creators" },
  { key: "financial_intelligence", href: "/financial", label: "Financial" },
  { key: "opportunity_engine", href: "/opportunities", label: "Opportunities" },
  { key: "economic_intelligence", href: "/economic", label: "Economic" },
  { key: "marketplace", href: "/marketplace", label: "Marketplace" },
];
