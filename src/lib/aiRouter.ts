// Task-based AI routing — the "which model handles this task" decision,
// centralized and operator-configurable via env vars (no code change needed
// to move a task to a cheaper/faster/different provider model).
//
// The app's streaming chat path (src/lib/anthropicRaw.ts + /api/chat) is
// deliberately NOT routed through here — it stays pinned to its proven
// Anthropic tool-using pipeline. This router serves the simple, non-streaming
// gateway completions (business/creator assistants, classifiers, summaries),
// letting operators point those at whichever provider/model fits.
//
// Tiers → models, each overridable:
//   AI_ROUTER_MODEL_DEFAULT  → default tier   (claude-haiku-4-5-20251001)
//   AI_ROUTER_MODEL_FAST     → cheap/fast      (claude-haiku-4-5-20251001)
//   AI_ROUTER_MODEL_COMPLEX  → hard reasoning  (claude-sonnet-5)
//   AI_ROUTER_MODEL_CODE     → code work       (claude-sonnet-5)
//   AI_ROUTER_MODEL_PRIVATE  → self-hosted/private deployment (claude-haiku-4-5-20251001)
//
// Swap any value for an OpenAI-compatible model (e.g. "gpt-4o-mini") and the
// model gateway picks the provider automatically via supportsModel().

export type AITier = "default" | "fast" | "complex" | "code" | "private";

export type AITask =
  | "default"
  | "business_qa"
  | "creator_qa"
  | "summarize"
  | "classify"
  | "complex_reasoning"
  | "code_generation";

export const TASK_TIER: Record<AITask, AITier> = {
  default: "default",
  business_qa: "fast",
  creator_qa: "fast",
  summarize: "fast",
  classify: "fast",
  complex_reasoning: "complex",
  code_generation: "code",
};

const DEFAULT_MODELS: Record<AITier, string> = {
  default: "claude-haiku-4-5-20251001",
  fast: "claude-haiku-4-5-20251001",
  complex: "claude-sonnet-5",
  code: "claude-sonnet-5",
  private: "claude-haiku-4-5-20251001",
};

const ENV_FOR_TIER: Record<AITier, string> = {
  default: "AI_ROUTER_MODEL_DEFAULT",
  fast: "AI_ROUTER_MODEL_FAST",
  complex: "AI_ROUTER_MODEL_COMPLEX",
  code: "AI_ROUTER_MODEL_CODE",
  private: "AI_ROUTER_MODEL_PRIVATE",
};

export function modelForTier(tier: AITier): string {
  return process.env[ENV_FOR_TIER[tier]] || DEFAULT_MODELS[tier];
}

export function modelForTask(task: AITask): string {
  return modelForTier(TASK_TIER[task]);
}

// One-stop helper for gateway call sites: gives the model AND a stable label
// for logging/observability of what tier a task landed on.
export function routeModel(task: AITask): { model: string; tier: AITier; task: AITask } {
  const tier = TASK_TIER[task];
  return { model: modelForTier(tier), tier, task };
}
