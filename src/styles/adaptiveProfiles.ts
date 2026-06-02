import type {
  AdaptiveExpressionConfigInput,
  AdaptiveExpressionStrategy,
  AdaptiveStyleProfile
} from "../schemas/adaptiveThemeHtmlPageSchema.js";
import type { UpgradedDesignTokensInput } from "../schemas/upgradedHtmlPageSchema.js";
import type { UpgradedInlineThemeTokens } from "./upgradedInlineThemes.js";

export type ResolvedAdaptiveStyleProfile = Exclude<AdaptiveStyleProfile, "auto">;
export type ResolvedAdaptiveExpressionStrategy = Exclude<AdaptiveExpressionStrategy, "auto">;

export interface AdaptiveInlineThemeTokens extends UpgradedInlineThemeTokens {
  fontFamily: string;
  outerBackground: string;
}

export interface AdaptiveProfileDefinition {
  theme: AdaptiveInlineThemeTokens;
  strategy: {
    defaultStructure: ResolvedAdaptiveExpressionStrategy;
    leadTreatment: string;
    summaryTreatment: string;
    sectionTreatment: string;
    sourceTreatment: string;
  };
}

const adaptiveProfileThemes: Record<ResolvedAdaptiveStyleProfile, AdaptiveInlineThemeTokens> = {
  "old-newspaper": {
    bg: "#efe2c6",
    surface: "#fbf1d8",
    panel: "#f4e5c6",
    text: "#24170f",
    muted: "#6b563c",
    primary: "#4b2f1c",
    primarySoft: "#ead6ac",
    accent: "#8a3b12",
    accentSoft: "#f0dfbd",
    border: "#8a7353",
    borderSubtle: "#d2bb91",
    borderCss: "1px solid #8a7353",
    radius: "0",
    radiusSmall: "0",
    shadow: "none",
    softShadow: "none",
    sectionPadding: "24px",
    cardPadding: "16px",
    gap: "12px",
    bodyFontSize: "15px",
    smallFontSize: "12.5px",
    h1FontSize: "30px",
    h2FontSize: "20px",
    h3FontSize: "16px",
    fontFamily: "Georgia, 'Times New Roman', 'Noto Serif SC', 'Songti SC', SimSun, FangSong, serif",
    outerBackground:
      "radial-gradient(circle at 8% 0%, rgba(138, 59, 18, 0.12), transparent 28%), repeating-linear-gradient(0deg, rgba(75, 47, 28, 0.035), rgba(75, 47, 28, 0.035) 1px, transparent 1px, transparent 5px), #efe2c6"
  },
  "academic-journal": {
    bg: "#f5f7fb",
    surface: "#ffffff",
    panel: "#f1f5f9",
    text: "#111827",
    muted: "#4b5563",
    primary: "#1e3a8a",
    primarySoft: "#e0e7ff",
    accent: "#0f766e",
    accentSoft: "#ccfbf1",
    border: "#9ca3af",
    borderSubtle: "#d1d5db",
    borderCss: "1px solid #cbd5e1",
    radius: "10px",
    radiusSmall: "6px",
    shadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    softShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
    sectionPadding: "24px",
    cardPadding: "16px",
    gap: "12px",
    bodyFontSize: "14.5px",
    smallFontSize: "12.5px",
    h1FontSize: "27px",
    h2FontSize: "18px",
    h3FontSize: "15px",
    fontFamily: "Georgia, 'Times New Roman', 'Noto Serif SC', 'Songti SC', SimSun, serif",
    outerBackground: "linear-gradient(180deg, #ffffff, #f5f7fb)"
  },
  "clean-magazine": {
    bg: "#f8fafc",
    surface: "#ffffff",
    panel: "#eef6ff",
    text: "#172033",
    muted: "#64748b",
    primary: "#2563eb",
    primarySoft: "#dbeafe",
    accent: "#f59e0b",
    accentSoft: "#fff7ed",
    border: "#cbd5e1",
    borderSubtle: "#e2e8f0",
    borderCss: "1px solid #dbe5f0",
    radius: "24px",
    radiusSmall: "18px",
    shadow: "0 18px 44px rgba(15, 23, 42, 0.10)",
    softShadow: "0 8px 22px rgba(15, 23, 42, 0.06)",
    sectionPadding: "30px",
    cardPadding: "20px",
    gap: "16px",
    bodyFontSize: "15px",
    smallFontSize: "12.5px",
    h1FontSize: "30px",
    h2FontSize: "20px",
    h3FontSize: "16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    outerBackground: "radial-gradient(circle at 12% 0%, rgba(37, 99, 235, 0.12), transparent 30%), #f8fafc"
  },
  "decision-brief": {
    bg: "#f6f7fb",
    surface: "#ffffff",
    panel: "#f1f5f9",
    text: "#111827",
    muted: "#4b5563",
    primary: "#1d4ed8",
    primarySoft: "#dbeafe",
    accent: "#f97316",
    accentSoft: "#ffedd5",
    border: "#94a3b8",
    borderSubtle: "#cbd5e1",
    borderCss: "1px solid #94a3b8",
    radius: "12px",
    radiusSmall: "8px",
    shadow: "0 10px 26px rgba(15, 23, 42, 0.10)",
    softShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
    sectionPadding: "22px",
    cardPadding: "14px",
    gap: "10px",
    bodyFontSize: "14px",
    smallFontSize: "12px",
    h1FontSize: "25px",
    h2FontSize: "17px",
    h3FontSize: "15px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    outerBackground: "linear-gradient(180deg, #ffffff, #f6f7fb)"
  },
  "workshop-guide": {
    bg: "#fff7ed",
    surface: "#ffffff",
    panel: "#ffedd5",
    text: "#2f1c0b",
    muted: "#7c4a18",
    primary: "#ea580c",
    primarySoft: "#fed7aa",
    accent: "#0f766e",
    accentSoft: "#ccfbf1",
    border: "#fdba74",
    borderSubtle: "#fed7aa",
    borderCss: "1px solid #fdba74",
    radius: "18px",
    radiusSmall: "14px",
    shadow: "0 14px 34px rgba(154, 52, 18, 0.12)",
    softShadow: "0 6px 16px rgba(154, 52, 18, 0.08)",
    sectionPadding: "26px",
    cardPadding: "18px",
    gap: "14px",
    bodyFontSize: "14.5px",
    smallFontSize: "12.5px",
    h1FontSize: "27px",
    h2FontSize: "18px",
    h3FontSize: "15px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    outerBackground: "radial-gradient(circle at 0% 0%, rgba(234, 88, 12, 0.14), transparent 28%), #fff7ed"
  },
  "curated-list": {
    bg: "#f8fafc",
    surface: "#ffffff",
    panel: "#f8fafc",
    text: "#111827",
    muted: "#64748b",
    primary: "#4f46e5",
    primarySoft: "#eef2ff",
    accent: "#06b6d4",
    accentSoft: "#cffafe",
    border: "#cbd5e1",
    borderSubtle: "#e2e8f0",
    borderCss: "1px solid #e2e8f0",
    radius: "20px",
    radiusSmall: "16px",
    shadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    softShadow: "0 5px 14px rgba(15, 23, 42, 0.05)",
    sectionPadding: "22px",
    cardPadding: "14px",
    gap: "10px",
    bodyFontSize: "14px",
    smallFontSize: "12px",
    h1FontSize: "25px",
    h2FontSize: "17px",
    h3FontSize: "15px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    outerBackground: "linear-gradient(135deg, #ffffff, #eef2ff)"
  },
  "editorial-column": {
    bg: "#fff7ed",
    surface: "#fffdf7",
    panel: "#f9ead2",
    text: "#2c1810",
    muted: "#6b4b35",
    primary: "#7c2d12",
    primarySoft: "#ffedd5",
    accent: "#be123c",
    accentSoft: "#ffe4e6",
    border: "#c08457",
    borderSubtle: "#e7c8a6",
    borderCss: "1px solid #c08457",
    radius: "8px",
    radiusSmall: "6px",
    shadow: "0 10px 26px rgba(124, 45, 18, 0.10)",
    softShadow: "0 4px 12px rgba(124, 45, 18, 0.06)",
    sectionPadding: "28px",
    cardPadding: "18px",
    gap: "14px",
    bodyFontSize: "15px",
    smallFontSize: "12.5px",
    h1FontSize: "30px",
    h2FontSize: "20px",
    h3FontSize: "16px",
    fontFamily: "Georgia, 'Times New Roman', 'Noto Serif SC', 'Songti SC', SimSun, FangSong, serif",
    outerBackground: "linear-gradient(180deg, #fffdf7, #fff7ed)"
  }
};

const adaptiveProfileDefinitions: Record<ResolvedAdaptiveStyleProfile, AdaptiveProfileDefinition> = {
  "old-newspaper": {
    theme: adaptiveProfileThemes["old-newspaper"],
    strategy: {
      defaultStructure: "inverted-pyramid",
      leadTreatment: "headline-lead-facts",
      summaryTreatment: "lead-and-factbox",
      sectionTreatment: "newspaper-columns",
      sourceTreatment: "footnotes"
    }
  },
  "academic-journal": {
    theme: adaptiveProfileThemes["academic-journal"],
    strategy: {
      defaultStructure: "academic",
      leadTreatment: "paper-title-abstract",
      summaryTreatment: "abstract-findings-limitations",
      sectionTreatment: "numbered-paper-sections",
      sourceTreatment: "bibliography"
    }
  },
  "clean-magazine": {
    theme: adaptiveProfileThemes["clean-magazine"],
    strategy: {
      defaultStructure: "top-down",
      leadTreatment: "magazine-deck",
      summaryTreatment: "insight-stack",
      sectionTreatment: "layered-feature",
      sourceTreatment: "further-reading"
    }
  },
  "decision-brief": {
    theme: adaptiveProfileThemes["decision-brief"],
    strategy: {
      defaultStructure: "decision",
      leadTreatment: "recommendation-first",
      summaryTreatment: "executive-brief",
      sectionTreatment: "memo-panels",
      sourceTreatment: "appendix-references"
    }
  },
  "workshop-guide": {
    theme: adaptiveProfileThemes["workshop-guide"],
    strategy: {
      defaultStructure: "workshop",
      leadTreatment: "learning-objective",
      summaryTreatment: "goal-prerequisites-output",
      sectionTreatment: "guided-path",
      sourceTreatment: "resource-list"
    }
  },
  "curated-list": {
    theme: adaptiveProfileThemes["curated-list"],
    strategy: {
      defaultStructure: "catalog",
      leadTreatment: "curator-note",
      summaryTreatment: "selection-criteria",
      sectionTreatment: "ranked-rows",
      sourceTreatment: "source-digest"
    }
  },
  "editorial-column": {
    theme: adaptiveProfileThemes["editorial-column"],
    strategy: {
      defaultStructure: "argument",
      leadTreatment: "thesis-column",
      summaryTreatment: "argument-thesis",
      sectionTreatment: "column-essay",
      sourceTreatment: "further-reading"
    }
  }
};

function applyTokenOverrides(
  baseTheme: AdaptiveInlineThemeTokens,
  tokens: UpgradedDesignTokensInput
): AdaptiveInlineThemeTokens {
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

  const primary = tokens?.primaryColor ?? baseTheme.primary;
  const accent = tokens?.accentColor ?? baseTheme.accent;
  const spacingKey = tokens?.spacingScale ?? (tokens?.density === "compact" ? "compact" : tokens?.density === "comfortable" ? "relaxed" : undefined);
  const fontKey = tokens?.fontScale;
  const radius = tokens?.cardRadius ? radiusMap[tokens.cardRadius] : baseTheme.radius;
  const shadow = tokens?.shadowLevel ? shadowMap[tokens.shadowLevel] : baseTheme.shadow;
  const borderStyle = tokens?.borderStyle;
  const borderCss =
    borderStyle === undefined
      ? baseTheme.borderCss
      : borderStyle === "none"
        ? "none"
        : borderStyle === "accent"
          ? `1px solid ${accent}`
          : borderStyle === "soft"
            ? `1px solid ${baseTheme.borderSubtle}`
            : `1px solid ${baseTheme.border}`;

  return {
    ...baseTheme,
    primary,
    accent,
    borderCss,
    radius,
    radiusSmall: radius === "999px" ? "18px" : radius,
    shadow,
    softShadow: shadow === "none" ? "none" : baseTheme.softShadow,
    ...(spacingKey ? spacingMap[spacingKey] : {}),
    ...(fontKey
      ? {
          bodyFontSize: fontMap[fontKey].body,
          smallFontSize: fontMap[fontKey].small,
          h1FontSize: fontMap[fontKey].h1,
          h2FontSize: fontMap[fontKey].h2,
          h3FontSize: fontMap[fontKey].h3
        }
      : {})
  };
}

export function resolveAdaptiveProfileDefinition(
  profile: ResolvedAdaptiveStyleProfile,
  tokens: UpgradedDesignTokensInput
): AdaptiveProfileDefinition {
  const baseDefinition = adaptiveProfileDefinitions[profile];
  const theme = applyTokenOverrides(baseDefinition.theme, tokens);

  return {
    ...baseDefinition,
    theme
  };
}

export function resolveAdaptiveExpressionStrategy(
  expression: AdaptiveExpressionConfigInput,
  definition: AdaptiveProfileDefinition
): ResolvedAdaptiveExpressionStrategy {
  if (expression?.strategy && expression.strategy !== "auto") {
    return expression.strategy;
  }

  if (expression?.emphasis === "recommendation" || expression?.emphasis === "comparison") {
    return "decision";
  }

  if (expression?.emphasis === "process") {
    return "workshop";
  }

  if (expression?.emphasis === "evidence" || expression?.emphasis === "sources") {
    return "academic";
  }

  return definition.strategy.defaultStructure;
}
