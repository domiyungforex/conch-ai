// Conch is a Canadian company being built in Nigeria — neither is the
// hardcoded default. This is deliberately thin: a region label + currency,
// nothing else. No tax rules, no compliance logic, no localized regulatory
// content — real tax/compliance work is an explicit activation criterion
// for Economic/Financial Intelligence (see modules.ts), not something to
// fabricate here.

export const REGIONS = ["global", "CA", "NG", "US", "UK"] as const;
export type Region = (typeof REGIONS)[number];

export interface RegionConfig {
  code: Region;
  label: string;
  currency: string;
}

export const REGION_CONFIG: Record<Region, RegionConfig> = {
  global: { code: "global", label: "Global", currency: "USD" },
  CA: { code: "CA", label: "Canada", currency: "CAD" },
  NG: { code: "NG", label: "Nigeria", currency: "NGN" },
  US: { code: "US", label: "United States", currency: "USD" },
  UK: { code: "UK", label: "United Kingdom", currency: "GBP" },
};

export function regionLabel(code: string): string {
  return REGION_CONFIG[code as Region]?.label ?? code;
}
