import type { HtmlTheme } from "../schemas/htmlPageSchema.js";
import type { UpgradedDesignTokensInput } from "../schemas/upgradedHtmlPageSchema.js";

interface BaseInlineThemeTokens {
  bg: string;
  surface: string;
  panel: string;
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  border: string;
  borderSubtle: string;
}

export interface UpgradedInlineThemeTokens extends BaseInlineThemeTokens {
  borderCss: string;
  radius: string;
  radiusSmall: string;
  shadow: string;
  softShadow: string;
  sectionPadding: string;
  cardPadding: string;
  gap: string;
  bodyFontSize: string;
  smallFontSize: string;
  h1FontSize: string;
  h2FontSize: string;
  h3FontSize: string;
}

const baseThemes: Record<HtmlTheme, BaseInlineThemeTokens> = {
  "modern-blue": {
    bg: "#f8fafc",
    surface: "#ffffff",
    panel: "#f1f5f9",
    text: "#0f172a",
    muted: "#64748b",
    primary: "#2563eb",
    primarySoft: "#eff6ff",
    accent: "#f59e0b",
    accentSoft: "#fffbeb",
    border: "#cbd5e1",
    borderSubtle: "#e2e8f0"
  },
  "minimal-gray": {
    bg: "#fafafa",
    surface: "#ffffff",
    panel: "#f4f4f5",
    text: "#18181b",
    muted: "#71717a",
    primary: "#18181b",
    primarySoft: "#f4f4f5",
    accent: "#52525b",
    accentSoft: "#f4f4f5",
    border: "#d4d4d8",
    borderSubtle: "#e4e4e7"
  },
  "warm-orange": {
    bg: "#fffbeb",
    surface: "#ffffff",
    panel: "#fff7ed",
    text: "#451a03",
    muted: "#78350f",
    primary: "#d97706",
    primarySoft: "#fef3c7",
    accent: "#0f766e",
    accentSoft: "#ccfbf1",
    border: "#fcd34d",
    borderSubtle: "#fde68a"
  },
  "dark-tech": {
    bg: "#09090b",
    surface: "#18181b",
    panel: "#111827",
    text: "#fafafa",
    muted: "#a1a1aa",
    primary: "#3b82f6",
    primarySoft: "rgba(59, 130, 246, 0.16)",
    accent: "#fbbf24",
    accentSoft: "rgba(251, 191, 36, 0.14)",
    border: "#3f3f46",
    borderSubtle: "#27272a"
  }
};

export function resolveUpgradedInlineTheme(
  themeName: HtmlTheme,
  tokens: UpgradedDesignTokensInput
): UpgradedInlineThemeTokens {
  const base = baseThemes[themeName] ?? baseThemes["modern-blue"];
  const primary = tokens?.primaryColor ?? base.primary;
  const accent = tokens?.accentColor ?? base.accent;
  const radiusMap = {
    none: "0",
    small: "8px",
    medium: "12px",
    large: "18px",
    pill: "999px"
  } as const;
  const spacingMap = {
    compact: { sectionPadding: "18px", cardPadding: "12px", gap: "10px" },
    normal: { sectionPadding: "24px", cardPadding: "16px", gap: "12px" },
    relaxed: { sectionPadding: "30px", cardPadding: "20px", gap: "16px" }
  } as const;
  const fontMap = {
    compact: { body: "13.5px", small: "12px", h1: "22px", h2: "16px", h3: "14px" },
    normal: { body: "14.5px", small: "12.5px", h1: "24px", h2: "17px", h3: "15px" },
    large: { body: "15.5px", small: "13px", h1: "28px", h2: "19px", h3: "16px" }
  } as const;
  const shadowMap = {
    none: "none",
    soft: "0 4px 10px rgba(15, 23, 42, 0.06)",
    medium: "0 10px 26px rgba(15, 23, 42, 0.10)",
    strong: "0 18px 44px rgba(15, 23, 42, 0.16)"
  } as const;

  const spacingKey = tokens?.spacingScale ?? (tokens?.density === "compact" ? "compact" : "normal");
  const fontKey = tokens?.fontScale ?? "normal";
  const radius = radiusMap[tokens?.cardRadius ?? "medium"];
  const borderStyle = tokens?.borderStyle ?? "solid";
  const borderCss =
    borderStyle === "none"
      ? "none"
      : borderStyle === "accent"
        ? `1px solid ${accent}`
        : borderStyle === "soft"
          ? `1px solid ${base.borderSubtle}`
          : `1px solid ${base.border}`;
  const shadow = shadowMap[tokens?.shadowLevel ?? "soft"];

  return {
    ...base,
    primary,
    accent,
    borderCss,
    radius,
    radiusSmall: radius === "999px" ? "18px" : radius,
    shadow,
    softShadow: shadow === "none" ? "none" : "0 4px 12px rgba(15, 23, 42, 0.06)",
    sectionPadding: spacingMap[spacingKey].sectionPadding,
    cardPadding: spacingMap[spacingKey].cardPadding,
    gap: spacingMap[spacingKey].gap,
    bodyFontSize: fontMap[fontKey].body,
    smallFontSize: fontMap[fontKey].small,
    h1FontSize: fontMap[fontKey].h1,
    h2FontSize: fontMap[fontKey].h2,
    h3FontSize: fontMap[fontKey].h3
  };
}
