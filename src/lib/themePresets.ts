export interface AccentPreset {
  id: string;
  name: string;
  /** Primary, secondary, tertiary — shown as the swatch gradient. */
  swatch: [string, string, string];
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "amber", name: "Smokey Amber", swatch: ["#c8891f", "#2e7f61", "#bd5f33"] },
  { id: "violet", name: "Memory Violet", swatch: ["#6d5cff", "#0e9f8a", "#c026d3"] },
  { id: "ocean", name: "Deep Ocean", swatch: ["#0e7490", "#0f766e", "#2563eb"] },
  { id: "rose", name: "Wild Rose", swatch: ["#d4546f", "#2e7f61", "#bd5f33"] },
  { id: "forest", name: "Forest", swatch: ["#3f8f5f", "#0f766e", "#9c7a1c"] },
];

export const DEFAULT_ACCENT = "amber";

export function isValidAccent(id: string | null): id is string {
  return !!id && ACCENT_PRESETS.some((p) => p.id === id);
}
