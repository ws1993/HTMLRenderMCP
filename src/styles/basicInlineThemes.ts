import type { HtmlTheme } from "../schemas/htmlPageSchema.js";

export interface InlineThemeTokens {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  border: string;
  borderSubtle: string;
  shadow: string;
  badgeBg: string;
  badgeText: string;
}

const themes: Record<HtmlTheme, InlineThemeTokens> = {
  "modern-blue": {
    bg: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    muted: "#64748b",
    primary: "#2563eb",
    primarySoft: "#eff6ff",
    border: "#cbd5e1",
    borderSubtle: "#e2e8f0",
    shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
    badgeBg: "#e0f2fe",
    badgeText: "#0369a1"
  },
  "minimal-gray": {
    bg: "#fafafa",
    surface: "#ffffff",
    text: "#18181b",
    muted: "#71717a",
    primary: "#18181b",
    primarySoft: "#f4f4f5",
    border: "#d4d4d8",
    borderSubtle: "#e4e4e7",
    shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
    badgeBg: "#f4f4f5",
    badgeText: "#27272a"
  },
  "dark-tech": {
    bg: "#09090b",
    surface: "#18181b",
    text: "#fafafa",
    muted: "#a1a1aa",
    primary: "#3b82f6",
    primarySoft: "rgba(59, 130, 246, 0.15)",
    border: "#3f3f46",
    borderSubtle: "#27272a",
    shadow: "0 8px 16px rgba(0, 0, 0, 0.4)",
    badgeBg: "rgba(255, 255, 255, 0.1)",
    badgeText: "#e4e4e7"
  },
  "warm-orange": {
    bg: "#fffbeb",
    surface: "#ffffff",
    text: "#451a03",
    muted: "#78350f",
    primary: "#d97706",
    primarySoft: "#fef3c7",
    border: "#fcd34d",
    borderSubtle: "#fde68a",
    shadow: "0 4px 6px -1px rgba(217, 119, 6, 0.05)",
    badgeBg: "#ffedd5",
    badgeText: "#c2410c"
  }
};

export function getInlineTheme(theme: HtmlTheme): InlineThemeTokens {
  return themes[theme] ?? themes["modern-blue"];
}
