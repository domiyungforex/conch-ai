// A real, minimal kill-switch primitive — env-var driven, so a feature that
// calls a metered/paid external service can be disabled instantly (flip the
// var, redeploy) without an application code change or DB migration.
//
// Deliberately NOT a full flag service: no DB-backed config, no per-user or
// per-org targeting, no percentage rollout, no admin UI. Those all have a
// real ongoing cost (schema, review, maintenance) that isn't justified for a
// product with no paying users yet. This exists to answer one question —
// "is this feature allowed to run right now" — for the handful of features
// that hit rate-limited or billed third-party APIs (Twelve Data, Anthropic
// code execution) and might need a fast, code-free way to be switched off.
export type FeatureFlag = "marketData" | "codeExecution";

const ENV_KEYS: Record<FeatureFlag, string> = {
  marketData: "FEATURE_MARKET_DATA",
  codeExecution: "FEATURE_CODE_EXECUTION",
};

// Every flag defaults to enabled — set the corresponding env var to "off" to
// disable it globally.
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return process.env[ENV_KEYS[flag]] !== "off";
}
