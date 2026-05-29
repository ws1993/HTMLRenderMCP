import type {
  AdaptiveExpressionConfigInput,
  AdaptiveExpressionInput,
  AdaptiveExpressionStrategy,
  AdaptiveStyleProfile,
  AdaptiveThemeHtmlPageInput
} from "../schemas/adaptiveThemeHtmlPageSchema.js";
import type {
  UpgradedContentType,
  UpgradedDesignTokensInput,
  UpgradedHtmlBlockInput
} from "../schemas/upgradedHtmlPageSchema.js";
import { escapeAttribute, escapeHtml } from "../utils/escapeHtml.js";
import { formatHtml } from "../utils/formatHtml.js";
import { normalizeRenderableHref } from "../utils/normalizeRenderableHref.js";
import { renderInlineRichTextParagraphs } from "../utils/renderInlineRichText.js";
import {
  renderBlock,
  renderFooter,
  style,
  type UpgradedInlineThemeTokens
} from "./renderUpgradedInlineHtml.js";

type ResolvedAdaptiveStyleProfile = Exclude<AdaptiveStyleProfile, "auto">;
type ResolvedAdaptiveExpressionStrategy = Exclude<AdaptiveExpressionStrategy, "auto">;

interface AdaptiveInlineThemeTokens extends UpgradedInlineThemeTokens {
  fontFamily: string;
  outerBackground: string;
}

interface AdaptiveProfileDefinition {
  theme: AdaptiveInlineThemeTokens;
  strategy: {
    defaultStructure: ResolvedAdaptiveExpressionStrategy;
    leadTreatment: string;
    summaryTreatment: string;
    sectionTreatment: string;
    sourceTreatment: string;
  };
}

interface AdaptiveRenderContext {
  profile: ResolvedAdaptiveStyleProfile;
  theme: AdaptiveInlineThemeTokens;
  definition: AdaptiveProfileDefinition;
  strategy: ResolvedAdaptiveExpressionStrategy;
  expression: AdaptiveExpressionConfigInput;
}

const profileByContentType: Array<{
  contentType: UpgradedContentType;
  profile: ResolvedAdaptiveStyleProfile;
}> = [
  { contentType: "news", profile: "old-newspaper" },
  { contentType: "opinion", profile: "editorial-column" },
  { contentType: "tutorial", profile: "workshop-guide" },
  { contentType: "compare", profile: "decision-brief" },
  { contentType: "research", profile: "academic-journal" },
  { contentType: "explain", profile: "clean-magazine" },
  { contentType: "list", profile: "curated-list" }
];

const profileThemes: Record<ResolvedAdaptiveStyleProfile, AdaptiveInlineThemeTokens> = {
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

const profileDefinitions: Record<ResolvedAdaptiveStyleProfile, AdaptiveProfileDefinition> = {
  "old-newspaper": {
    theme: profileThemes["old-newspaper"],
    strategy: {
      defaultStructure: "inverted-pyramid",
      leadTreatment: "headline-lead-facts",
      summaryTreatment: "lead-and-factbox",
      sectionTreatment: "newspaper-columns",
      sourceTreatment: "footnotes"
    }
  },
  "academic-journal": {
    theme: profileThemes["academic-journal"],
    strategy: {
      defaultStructure: "academic",
      leadTreatment: "paper-title-abstract",
      summaryTreatment: "abstract-findings-limitations",
      sectionTreatment: "numbered-paper-sections",
      sourceTreatment: "bibliography"
    }
  },
  "clean-magazine": {
    theme: profileThemes["clean-magazine"],
    strategy: {
      defaultStructure: "top-down",
      leadTreatment: "magazine-deck",
      summaryTreatment: "insight-stack",
      sectionTreatment: "layered-feature",
      sourceTreatment: "further-reading"
    }
  },
  "decision-brief": {
    theme: profileThemes["decision-brief"],
    strategy: {
      defaultStructure: "decision",
      leadTreatment: "recommendation-first",
      summaryTreatment: "executive-brief",
      sectionTreatment: "memo-panels",
      sourceTreatment: "appendix-references"
    }
  },
  "workshop-guide": {
    theme: profileThemes["workshop-guide"],
    strategy: {
      defaultStructure: "workshop",
      leadTreatment: "learning-objective",
      summaryTreatment: "goal-prerequisites-output",
      sectionTreatment: "guided-path",
      sourceTreatment: "resource-list"
    }
  },
  "curated-list": {
    theme: profileThemes["curated-list"],
    strategy: {
      defaultStructure: "catalog",
      leadTreatment: "curator-note",
      summaryTreatment: "selection-criteria",
      sectionTreatment: "ranked-rows",
      sourceTreatment: "source-digest"
    }
  },
  "editorial-column": {
    theme: profileThemes["editorial-column"],
    strategy: {
      defaultStructure: "argument",
      leadTreatment: "thesis-column",
      summaryTreatment: "argument-thesis",
      sectionTreatment: "column-essay",
      sourceTreatment: "further-reading"
    }
  }
};

function resolveStyleProfile(
  contentTypes: UpgradedContentType[],
  requestedProfile: AdaptiveStyleProfile
): ResolvedAdaptiveStyleProfile {
  if (requestedProfile !== "auto") {
    return requestedProfile;
  }

  for (const candidate of profileByContentType) {
    if (contentTypes.includes(candidate.contentType)) {
      return candidate.profile;
    }
  }

  return "clean-magazine";
}

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

function resolveExpressionStrategy(
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

function resolveAdaptiveContext(input: AdaptiveThemeHtmlPageInput): AdaptiveRenderContext {
  const profile = resolveStyleProfile(input.contentTypes, input.styleProfile);
  const baseDefinition = profileDefinitions[profile];
  const theme = applyTokenOverrides(baseDefinition.theme, input.tokens);
  const definition: AdaptiveProfileDefinition = {
    ...baseDefinition,
    theme
  };
  const strategy = resolveExpressionStrategy(input.expression, definition);

  return {
    profile,
    theme,
    definition,
    strategy,
    expression: input.expression
  };
}

function renderParagraphGroup(
  value: unknown,
  options: {
    singleTag?: "p" | "div";
    singleStyle?: string;
    multiWrapperStyle?: string;
    multiParagraphStyle?: string;
  } = {}
): string {
  const paragraphs = renderInlineRichTextParagraphs(value);

  if (paragraphs.length === 0) {
    return "";
  }

  if (paragraphs.length === 1) {
    const tag = options.singleTag ?? "p";
    const styleAttribute = options.singleStyle ? ` style="${escapeAttribute(options.singleStyle)}"` : "";

    return `<${tag}${styleAttribute}>${paragraphs[0]}</${tag}>`;
  }

  const wrapperStyleAttribute = options.multiWrapperStyle
    ? ` style="${escapeAttribute(options.multiWrapperStyle)}"`
    : "";
  const paragraphStyleAttribute = options.multiParagraphStyle
    ? ` style="${escapeAttribute(options.multiParagraphStyle)}"`
    : "";

  return `<div${wrapperStyleAttribute}>${paragraphs
    .map((paragraph) => `<p${paragraphStyleAttribute}>${paragraph}</p>`)
    .join("")}</div>`;
}

function bodyTextStyle(
  theme: AdaptiveInlineThemeTokens,
  overrides: Record<string, string | number | undefined> = {}
): string {
  return style({ margin: 0, "font-size": theme.bodyFontSize, color: theme.muted, "line-height": 1.68, ...overrides });
}

function renderBodyText(value: unknown, theme: AdaptiveInlineThemeTokens, color = theme.muted): string {
  return renderParagraphGroup(value, {
    singleStyle: bodyTextStyle(theme, { color }),
    multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "10px" }),
    multiParagraphStyle: bodyTextStyle(theme, { color })
  });
}

function renderAdaptiveSection(
  kind: "expression" | "block",
  type: string,
  innerHtml: string,
  context: AdaptiveRenderContext,
  isFirst: boolean,
  options: { background?: string; borderTop?: string } = {}
): string {
  const { theme } = context;
  const attribute = kind === "expression" ? "data-expression-type" : "data-block-type";
  const borderTop = options.borderTop ?? (isFirst ? "none" : `1px solid ${theme.borderSubtle}`);

  return `<div ${attribute}="${escapeAttribute(type)}" data-expression-treatment="${escapeAttribute(
    context.definition.strategy.sectionTreatment
  )}" style="${escapeAttribute(
    style({
      padding: theme.sectionPadding,
      background: options.background ?? theme.surface,
      "border-top": borderTop
    })
  )}">${innerHtml}</div>`;
}

function renderEyebrow(value: string | undefined, context: AdaptiveRenderContext): string {
  if (!value) {
    return "";
  }

  const { theme } = context;

  return `<div style="${escapeAttribute(
    style({
      "font-size": theme.smallFontSize,
      "font-weight": 800,
      color: theme.primary,
      "letter-spacing": context.profile === "old-newspaper" ? "0.08em" : "0.05em",
      "text-transform": "uppercase",
      "margin-bottom": "8px"
    })
  )}">${escapeHtml(value)}</div>`;
}

function renderSectionHeading(title: string | undefined, intro: string | undefined, context: AdaptiveRenderContext): string {
  const { theme } = context;

  if (!title && !intro) {
    return "";
  }

  return `<div style="${escapeAttribute(style({ "margin-bottom": theme.gap }))}">
    ${title
      ? `<h2 style="${escapeAttribute(
          style({
            margin: "0 0 8px 0",
            "font-size": theme.h2FontSize,
            "font-weight": context.profile === "old-newspaper" ? 800 : 760,
            color: theme.text,
            "line-height": 1.35,
            "letter-spacing": context.profile === "old-newspaper" ? "0" : "-0.01em"
          })
        )}">${escapeHtml(title)}</h2>`
      : ""}
    ${intro ? renderBodyText(intro, theme) : ""}
  </div>`;
}

function renderFactStrip(
  facts: Array<{ label: string; value: string; detail?: string }> | undefined,
  context: AdaptiveRenderContext
): string {
  if (!facts?.length) {
    return "";
  }

  const { theme } = context;
  const border = context.profile === "old-newspaper" ? `1px solid ${theme.border}` : `1px solid ${theme.borderSubtle}`;

  return `<div style="${escapeAttribute(
    style({
      display: "grid",
      "grid-template-columns": "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 0,
      "margin-top": "16px",
      border,
      background: theme.panel
    })
  )}">
    ${facts
      .map(
        (fact) => `<div style="${escapeAttribute(
          style({ padding: "12px", "border-right": `1px solid ${theme.borderSubtle}`, "min-width": 0 })
        )}">
          <div style="${escapeAttribute(style({ "font-size": theme.smallFontSize, "font-weight": 800, color: theme.primary }))}">${escapeHtml(fact.label)}</div>
          <div style="${escapeAttribute(style({ "margin-top": "4px", "font-size": theme.h3FontSize, "font-weight": 850, color: theme.text, "line-height": 1.25 }))}">${escapeHtml(fact.value)}</div>
          ${fact.detail ? renderBodyText(fact.detail, theme) : ""}
        </div>`
      )
      .join("")}
  </div>`;
}

function renderSimpleList(items: string[] | undefined, context: AdaptiveRenderContext, ordered = false): string {
  if (!items?.length) {
    return "";
  }

  const { theme } = context;
  const tag = ordered ? "ol" : "ul";

  return `<${tag} style="${escapeAttribute(
    style({ margin: "10px 0 0 0", padding: ordered ? "0 0 0 22px" : "0 0 0 18px", color: theme.muted, "font-size": theme.bodyFontSize, "line-height": 1.65 })
  )}">${items.map((item) => `<li style="${escapeAttribute(style({ margin: "4px 0" }))}">${escapeHtml(item)}</li>`).join("")}</${tag}>`;
}

function renderTitledRows(
  items: Array<{ title: string; body?: string }>,
  context: AdaptiveRenderContext,
  options: { ordered?: boolean; startAt?: number } = {}
): string {
  const { theme } = context;
  const startAt = options.startAt ?? 1;

  return `<div style="${escapeAttribute(style({ display: "flex", "flex-direction": "column", gap: theme.gap }))}">
    ${items
      .map(
        (item, index) => `<div style="${escapeAttribute(
          style({
            display: "grid",
            "grid-template-columns": options.ordered ? "34px 1fr" : "1fr",
            gap: "12px",
            padding: context.profile === "old-newspaper" ? "0 0 12px 0" : theme.cardPadding,
            background: context.profile === "old-newspaper" ? "transparent" : theme.panel,
            border: context.profile === "old-newspaper" ? "none" : `1px solid ${theme.borderSubtle}`,
            "border-bottom": context.profile === "old-newspaper" ? `1px solid ${theme.borderSubtle}` : undefined,
            "border-radius": context.profile === "old-newspaper" ? "0" : theme.radiusSmall
          })
        )}">
          ${options.ordered
            ? `<div style="${escapeAttribute(
                style({
                  width: "28px",
                  height: "28px",
                  "border-radius": context.profile === "old-newspaper" ? "0" : "999px",
                  background: theme.primarySoft,
                  color: theme.primary,
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "center",
                  "font-size": theme.smallFontSize,
                  "font-weight": 850
                })
              )}">${escapeHtml(String(startAt + index))}</div>`
            : ""}
          <div>
            <h3 style="${escapeAttribute(style({ margin: "0 0 5px 0", "font-size": theme.h3FontSize, "font-weight": 800, color: theme.text, "line-height": 1.35 }))}">${escapeHtml(item.title)}</h3>
            ${item.body ? renderBodyText(item.body, theme) : ""}
          </div>
        </div>`
      )
      .join("")}
  </div>`;
}

function renderLeadExpression(
  expression: Extract<AdaptiveExpressionInput, { type: "lead" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const { theme } = context;
  const titleSize = context.expression?.hierarchy === "flat" ? theme.h2FontSize : theme.h1FontSize;
  const background = context.profile === "old-newspaper" ? theme.surface : `linear-gradient(135deg, ${theme.surface}, ${theme.primarySoft})`;
  const inner = `${renderEyebrow(expression.eyebrow ?? context.definition.strategy.leadTreatment, context)}
    ${expression.title
      ? `<h1 style="${escapeAttribute(
          style({ margin: 0, "font-size": titleSize, "font-weight": 880, color: theme.text, "line-height": 1.18, "letter-spacing": context.profile === "old-newspaper" ? "0" : "-0.025em" })
        )}">${escapeHtml(expression.title)}</h1>`
      : ""}
    ${renderParagraphGroup(expression.body, {
      singleStyle: bodyTextStyle(theme, {
        "margin-top": expression.title ? "12px" : "0",
        color: theme.text,
        "font-size": context.profile === "old-newspaper" ? "17px" : theme.bodyFontSize,
        "font-weight": context.strategy === "decision" ? 750 : 500
      }),
      multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "10px", "margin-top": expression.title ? "12px" : "0" }),
      multiParagraphStyle: bodyTextStyle(theme, { color: theme.text, "font-size": context.profile === "old-newspaper" ? "17px" : theme.bodyFontSize })
    })}
    ${renderFactStrip(expression.facts, context)}`;

  return renderAdaptiveSection("expression", expression.type, inner, context, isFirst, { background });
}

function renderKeyTakeawaysExpression(
  expression: Extract<AdaptiveExpressionInput, { type: "key-takeaways" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const inner = `${renderSectionHeading(expression.title ?? "Key takeaways", expression.intro, context)}
    ${renderTitledRows(expression.items, context, { ordered: context.expression?.hierarchy !== "flat" })}`;

  return renderAdaptiveSection("expression", expression.type, inner, context, isFirst);
}

function renderExecutiveSummaryExpression(
  expression: Extract<AdaptiveExpressionInput, { type: "executive-summary" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const { theme } = context;
  const inner = `${renderSectionHeading(expression.title ?? "Executive summary", undefined, context)}
    ${expression.ask
      ? `<div style="${escapeAttribute(style({ "font-size": theme.smallFontSize, "font-weight": 800, color: theme.primary, "margin-bottom": "8px" }))}">Ask: ${escapeHtml(expression.ask)}</div>`
      : ""}
    <div style="${escapeAttribute(
      style({ padding: theme.cardPadding, background: theme.primarySoft, border: `1px solid ${theme.primary}`, "border-radius": theme.radiusSmall })
    )}">
      <div style="${escapeAttribute(style({ "font-size": theme.smallFontSize, "font-weight": 850, color: theme.primary, "text-transform": "uppercase", "letter-spacing": "0.04em" }))}">Recommendation first</div>
      ${renderParagraphGroup(expression.recommendation, {
        singleStyle: bodyTextStyle(theme, { color: theme.text, "font-weight": 800, "font-size": theme.h3FontSize, "margin-top": "6px" }),
        multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "8px", "margin-top": "6px" }),
        multiParagraphStyle: bodyTextStyle(theme, { color: theme.text, "font-weight": 800, "font-size": theme.h3FontSize })
      })}
    </div>
    ${renderSimpleList(expression.decisionHeadlines, context, false)}
    ${expression.rationale ? renderSectionHeading("Rationale", expression.rationale, context) : ""}
    ${expression.impact ? renderSectionHeading("Expected impact", expression.impact, context) : ""}`;

  return renderAdaptiveSection("expression", expression.type, inner, context, isFirst);
}

function renderEvidenceMapExpression(
  expression: Extract<AdaptiveExpressionInput, { type: "evidence-map" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const { theme } = context;
  const evidence = expression.evidence.map((item) => ({
    title: `${item.title}${item.confidence ? ` (${item.confidence} confidence)` : ""}`,
    body: item.body
  }));
  const inner = `${renderSectionHeading(expression.title ?? "Evidence map", undefined, context)}
    <div style="${escapeAttribute(style({ padding: theme.cardPadding, background: theme.panel, border: `1px solid ${theme.borderSubtle}`, "border-radius": theme.radiusSmall, "margin-bottom": theme.gap }))}">
      <div style="${escapeAttribute(style({ "font-size": theme.smallFontSize, "font-weight": 850, color: theme.primary }))}">Claim</div>
      ${renderBodyText(expression.claim, theme, theme.text)}
    </div>
    ${renderTitledRows(evidence, context, { ordered: true })}
    ${expression.limitations?.length ? `<div style="${escapeAttribute(style({ "margin-top": theme.gap }))}">${renderSectionHeading("Limitations", undefined, context)}${renderSimpleList(expression.limitations, context)}</div>` : ""}`;

  return renderAdaptiveSection("expression", expression.type, inner, context, isFirst);
}

function renderDecisionMatrixExpression(
  expression: Extract<AdaptiveExpressionInput, { type: "decision-matrix" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const { theme } = context;
  const verdictColor = {
    recommended: theme.primary,
    acceptable: theme.accent,
    risky: "#b45309",
    reject: "#b91c1c"
  } as const;
  const inner = `${renderSectionHeading(expression.title, expression.intro, context)}
    ${expression.recommendation
      ? `<div style="${escapeAttribute(style({ padding: theme.cardPadding, background: theme.primarySoft, border: `1px solid ${theme.primary}`, "border-radius": theme.radiusSmall, "margin-bottom": theme.gap }))}">${renderBodyText(expression.recommendation, theme, theme.text)}</div>`
      : ""}
    <div style="${escapeAttribute(style({ overflow: "auto", border: `1px solid ${theme.borderSubtle}`, "border-radius": theme.radiusSmall }))}">
      <table style="${escapeAttribute(style({ width: "100%", "border-collapse": "collapse", "font-size": theme.smallFontSize, color: theme.text }))}">
        <thead><tr>
          <th style="${escapeAttribute(style({ padding: "10px", background: theme.panel, "border-bottom": `1px solid ${theme.borderSubtle}`, "text-align": "left" }))}">Option</th>
          <th style="${escapeAttribute(style({ padding: "10px", background: theme.panel, "border-bottom": `1px solid ${theme.borderSubtle}`, "text-align": "left" }))}">Verdict</th>
          ${expression.criteria.map((criterion) => `<th style="${escapeAttribute(style({ padding: "10px", background: theme.panel, "border-bottom": `1px solid ${theme.borderSubtle}`, "text-align": "left" }))}">${escapeHtml(criterion)}</th>`).join("")}
          <th style="${escapeAttribute(style({ padding: "10px", background: theme.panel, "border-bottom": `1px solid ${theme.borderSubtle}`, "text-align": "left" }))}">Rationale</th>
        </tr></thead>
        <tbody>${expression.options
          .map(
            (option) => `<tr>
              <td style="${escapeAttribute(style({ padding: "10px", "border-top": `1px solid ${theme.borderSubtle}`, "font-weight": 800 }))}">${escapeHtml(option.name)}</td>
              <td style="${escapeAttribute(style({ padding: "10px", "border-top": `1px solid ${theme.borderSubtle}`, color: option.verdict ? verdictColor[option.verdict] : theme.muted, "font-weight": 800 }))}">${escapeHtml(option.verdict ?? "-")}</td>
              ${expression.criteria.map((_, index) => `<td style="${escapeAttribute(style({ padding: "10px", "border-top": `1px solid ${theme.borderSubtle}` }))}">${escapeHtml(option.scores?.[index] ?? "")}</td>`).join("")}
              <td style="${escapeAttribute(style({ padding: "10px", "border-top": `1px solid ${theme.borderSubtle}`, color: theme.muted }))}">${escapeHtml(option.rationale ?? "")}</td>
            </tr>`
          )
          .join("")}</tbody>
      </table>
    </div>`;

  return renderAdaptiveSection("expression", expression.type, inner, context, isFirst);
}

function renderArgumentMapExpression(
  expression: Extract<AdaptiveExpressionInput, { type: "argument-map" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const { theme } = context;
  const inner = `${renderSectionHeading(expression.title ?? "Argument map", undefined, context)}
    <div style="${escapeAttribute(style({ padding: theme.cardPadding, background: theme.panel, border: `1px solid ${theme.borderSubtle}`, "border-radius": theme.radiusSmall, "margin-bottom": theme.gap }))}">
      <div style="${escapeAttribute(style({ "font-size": theme.smallFontSize, "font-weight": 850, color: theme.primary }))}">Thesis</div>
      ${renderBodyText(expression.claim, theme, theme.text)}
    </div>
    ${renderSectionHeading("Reasons", undefined, context)}
    ${renderTitledRows(expression.reasons, context, { ordered: true })}
    ${expression.counterarguments?.length ? `<div style="${escapeAttribute(style({ "margin-top": theme.gap }))}">${renderSectionHeading("Counterarguments", undefined, context)}${renderTitledRows(expression.counterarguments, context)}</div>` : ""}
    ${expression.conclusion ? `<div style="${escapeAttribute(style({ "margin-top": theme.gap }))}">${renderSectionHeading("Conclusion", expression.conclusion, context)}</div>` : ""}`;

  return renderAdaptiveSection("expression", expression.type, inner, context, isFirst);
}

function renderProcessGuideExpression(
  expression: Extract<AdaptiveExpressionInput, { type: "process-guide" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const { theme } = context;
  const stepRows = expression.steps.map((step) => ({
    title: step.title,
    body: [step.body, step.output ? `Output: ${step.output}` : undefined, step.checkpoint ? `Checkpoint: ${step.checkpoint}` : undefined]
      .filter(Boolean)
      .join("\n\n")
  }));
  const inner = `${renderSectionHeading(expression.title, undefined, context)}
    <div style="${escapeAttribute(style({ padding: theme.cardPadding, background: theme.primarySoft, border: `1px solid ${theme.borderSubtle}`, "border-radius": theme.radiusSmall, "margin-bottom": theme.gap }))}">
      <div style="${escapeAttribute(style({ "font-size": theme.smallFontSize, "font-weight": 850, color: theme.primary }))}">Goal</div>
      ${renderBodyText(expression.goal, theme, theme.text)}
    </div>
    ${expression.prerequisites?.length ? `<div style="${escapeAttribute(style({ "margin-bottom": theme.gap }))}">${renderSectionHeading("Prerequisites", undefined, context)}${renderSimpleList(expression.prerequisites, context)}</div>` : ""}
    ${renderTitledRows(stepRows, context, { ordered: true })}
    ${expression.checks?.length ? `<div style="${escapeAttribute(style({ "margin-top": theme.gap }))}">${renderSectionHeading("Checks", undefined, context)}${renderSimpleList(expression.checks, context)}</div>` : ""}`;

  return renderAdaptiveSection("expression", expression.type, inner, context, isFirst);
}

function renderRankedListExpression(
  expression: Extract<AdaptiveExpressionInput, { type: "ranked-list" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const { theme } = context;
  const inner = `${renderSectionHeading(expression.title, expression.intro, context)}
    <div style="${escapeAttribute(style({ display: "flex", "flex-direction": "column", gap: theme.gap }))}">${expression.items
      .map(
        (item, index) => `<div style="${escapeAttribute(style({ display: "grid", "grid-template-columns": "42px 1fr", gap: "12px", padding: theme.cardPadding, background: theme.panel, border: `1px solid ${theme.borderSubtle}`, "border-radius": theme.radiusSmall }))}">
          <div style="${escapeAttribute(style({ "font-size": theme.h3FontSize, "font-weight": 900, color: theme.primary }))}">${escapeHtml(String(item.rank ?? index + 1))}</div>
          <div>
            <h3 style="${escapeAttribute(style({ margin: "0 0 5px 0", "font-size": theme.h3FontSize, "font-weight": 800, color: theme.text }))}">${escapeHtml(item.title)}</h3>
            ${item.fit ? `<div style="${escapeAttribute(style({ "font-size": theme.smallFontSize, "font-weight": 800, color: theme.accent, "margin-bottom": "5px" }))}">${escapeHtml(item.fit)}</div>` : ""}
            ${item.body ? renderBodyText(item.body, theme) : ""}
            ${item.tags?.length ? `<div style="${escapeAttribute(style({ display: "flex", "flex-wrap": "wrap", gap: "6px", "margin-top": "8px" }))}">${item.tags.map((tag) => `<span style="${escapeAttribute(style({ padding: "3px 7px", background: theme.accentSoft, color: theme.accent, "border-radius": "999px", "font-size": theme.smallFontSize, "font-weight": 750 }))}">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
          </div>
        </div>`
      )
      .join("")}</div>`;

  return renderAdaptiveSection("expression", expression.type, inner, context, isFirst);
}

function renderSectionOutlineExpression(
  expression: Extract<AdaptiveExpressionInput, { type: "section-outline" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const { theme } = context;
  const inner = `${renderSectionHeading(expression.title, expression.intro, context)}
    <div style="${escapeAttribute(style({ display: "flex", "flex-direction": "column", gap: theme.gap }))}">${expression.sections
      .map(
        (section, index) => `<div style="${escapeAttribute(style({ padding: theme.cardPadding, background: theme.panel, border: `1px solid ${theme.borderSubtle}`, "border-radius": theme.radiusSmall }))}">
          <h3 style="${escapeAttribute(style({ margin: "0 0 6px 0", "font-size": theme.h3FontSize, "font-weight": 850, color: theme.text }))}">${escapeHtml(`${index + 1}. ${section.title}`)}</h3>
          ${section.body ? renderBodyText(section.body, theme) : ""}
          ${section.children?.length ? `<div style="${escapeAttribute(style({ "margin-top": "8px" }))}">${renderTitledRows(section.children, context)}</div>` : ""}
        </div>`
      )
      .join("")}</div>`;

  return renderAdaptiveSection("expression", expression.type, inner, context, isFirst);
}

function renderAdaptiveExpression(
  expression: AdaptiveExpressionInput,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  switch (expression.type) {
    case "lead":
      return renderLeadExpression(expression, context, isFirst);
    case "key-takeaways":
      return renderKeyTakeawaysExpression(expression, context, isFirst);
    case "executive-summary":
      return renderExecutiveSummaryExpression(expression, context, isFirst);
    case "evidence-map":
      return renderEvidenceMapExpression(expression, context, isFirst);
    case "decision-matrix":
      return renderDecisionMatrixExpression(expression, context, isFirst);
    case "argument-map":
      return renderArgumentMapExpression(expression, context, isFirst);
    case "process-guide":
      return renderProcessGuideExpression(expression, context, isFirst);
    case "ranked-list":
      return renderRankedListExpression(expression, context, isFirst);
    case "section-outline":
      return renderSectionOutlineExpression(expression, context, isFirst);
  }
}

function getResolvedExpressions(input: AdaptiveThemeHtmlPageInput, context: AdaptiveRenderContext): AdaptiveExpressionInput[] {
  const explicitExpressions = input.expressions ?? [];
  const explicitTypes = new Set(explicitExpressions.map((expression) => expression.type));
  const generated: AdaptiveExpressionInput[] = [];

  if (context.expression?.coreViewpoint && !explicitTypes.has("lead") && !explicitTypes.has("executive-summary")) {
    if (context.strategy === "decision") {
      generated.push({
        type: "executive-summary",
        title: input.title,
        recommendation: context.expression.coreViewpoint,
        decisionHeadlines: context.expression.keyTakeaways
      });
    } else {
      generated.push({
        type: "lead",
        eyebrow: context.expression.emphasis ?? context.strategy,
        title: input.title,
        body: context.expression.coreViewpoint
      });
    }
  }

  if (context.expression?.keyTakeaways?.length && !explicitTypes.has("key-takeaways")) {
    generated.push({
      type: "key-takeaways",
      title: "Key takeaways",
      items: context.expression.keyTakeaways.map((takeaway, index) => ({
        title: `Point ${index + 1}`,
        body: takeaway
      }))
    });
  }

  return [...generated, ...explicitExpressions];
}

function renderAdaptiveHero(
  block: Extract<UpgradedHtmlBlockInput, { type: "hero" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const { theme } = context;
  const facts = block.highlights?.map((item) => ({ label: item.label, value: item.value, detail: item.detail }));
  const href = normalizeRenderableHref(block.cta?.href);
  const meta = block.meta?.length
    ? `<div style="${escapeAttribute(style({ display: "flex", "flex-wrap": "wrap", gap: "7px", "margin-top": "12px" }))}">${block.meta
        .map(
          (item) => `<span style="${escapeAttribute(style({ padding: "3px 8px", background: theme.primarySoft, color: theme.primary, "border-radius": context.profile === "old-newspaper" ? "0" : "999px", "font-size": theme.smallFontSize, "font-weight": 800 }))}">${escapeHtml(item)}</span>`
        )
        .join("")}</div>`
    : "";
  const cta = block.cta && href
    ? `<a href="${escapeAttribute(href)}" style="${escapeAttribute(style({ display: "inline-block", "margin-top": "14px", padding: "8px 14px", background: theme.primary, color: "#ffffff", "text-decoration": "none", "border-radius": context.profile === "old-newspaper" ? "0" : theme.radiusSmall, "font-size": theme.smallFontSize, "font-weight": 800 }))}">${escapeHtml(block.cta.label)}</a>`
    : "";
  const inner = `${renderEyebrow(block.eyebrow ?? context.definition.strategy.leadTreatment, context)}
    <h1 style="${escapeAttribute(style({ margin: 0, "font-size": theme.h1FontSize, "font-weight": 880, color: theme.text, "line-height": 1.2, "letter-spacing": context.profile === "old-newspaper" ? "0" : "-0.025em" }))}">${escapeHtml(block.title)}</h1>
    ${block.subtitle ? renderBodyText(block.subtitle, theme, theme.text) : ""}
    ${meta}
    ${renderFactStrip(facts, context)}
    ${cta}`;

  return renderAdaptiveSection("block", block.type, inner, context, isFirst, {
    background: context.profile === "old-newspaper" ? theme.surface : `linear-gradient(135deg, ${theme.surface}, ${theme.primarySoft})`
  });
}

function renderAdaptiveSummaryCard(
  block: Extract<UpgradedHtmlBlockInput, { type: "summary-card" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const { theme } = context;
  const inner = `${renderSectionHeading(block.title, undefined, context)}
    <div style="${escapeAttribute(style({ padding: context.profile === "old-newspaper" ? "0" : theme.cardPadding, background: context.profile === "old-newspaper" ? "transparent" : theme.panel, border: context.profile === "old-newspaper" ? "none" : `1px solid ${theme.borderSubtle}`, "border-radius": context.profile === "old-newspaper" ? "0" : theme.radiusSmall }))}">
      ${renderBodyText(block.body, theme, theme.text)}
    </div>
    ${block.items?.length ? `<div style="${escapeAttribute(style({ "margin-top": theme.gap }))}">${renderTitledRows(block.items, context, { ordered: context.strategy !== "academic" })}</div>` : ""}`;

  return renderAdaptiveSection("block", block.type, inner, context, isFirst);
}

function renderAdaptiveStatGrid(
  block: Extract<UpgradedHtmlBlockInput, { type: "stat-grid" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const inner = `${renderSectionHeading(block.title, block.intro, context)}${renderFactStrip(block.items, context)}`;

  return renderAdaptiveSection("block", block.type, inner, context, isFirst);
}

function renderAdaptiveSteps(
  block: Extract<UpgradedHtmlBlockInput, { type: "steps" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const inner = `${renderSectionHeading(block.title, block.intro, context)}${renderTitledRows(block.items, context, { ordered: true })}`;

  return renderAdaptiveSection("block", block.type, inner, context, isFirst);
}

function renderAdaptiveSourceList(
  block: Extract<UpgradedHtmlBlockInput, { type: "source-list" }>,
  context: AdaptiveRenderContext,
  isFirst: boolean
): string {
  const { theme } = context;
  const inner = `${renderSectionHeading(block.title, block.intro, context)}
    <ol style="${escapeAttribute(style({ margin: 0, padding: "0 0 0 22px", color: theme.muted, "font-size": theme.bodyFontSize, "line-height": 1.65 }))}">${block.items
      .map((item) => {
        const href = normalizeRenderableHref(item.href);
        const label = href
          ? `<a href="${escapeAttribute(href)}" style="${escapeAttribute(style({ color: theme.primary, "font-weight": 800, "text-decoration": "none" }))}">${escapeHtml(item.label)}</a>`
          : `<span style="${escapeAttribute(style({ color: theme.text, "font-weight": 800 }))}">${escapeHtml(item.label)}</span>`;

        return `<li style="${escapeAttribute(style({ margin: "8px 0" }))}">${label}${item.description ? `<div style="${escapeAttribute(style({ "font-size": theme.smallFontSize, color: theme.muted }))}">${escapeHtml(item.description)}</div>` : ""}</li>`;
      })
      .join("")}</ol>`;

  return renderAdaptiveSection("block", block.type, inner, context, isFirst);
}

function renderAdaptiveBlock(block: UpgradedHtmlBlockInput, context: AdaptiveRenderContext, isFirst: boolean): string {
  switch (block.type) {
    case "hero":
      return renderAdaptiveHero(block, context, isFirst);
    case "summary-card":
      return renderAdaptiveSummaryCard(block, context, isFirst);
    case "stat-grid":
      return renderAdaptiveStatGrid(block, context, isFirst);
    case "steps":
      return renderAdaptiveSteps(block, context, isFirst);
    case "source-list":
      return renderAdaptiveSourceList(block, context, isFirst);
    default:
      return renderBlock(block, context.theme, isFirst);
  }
}

function getExpressionTypes(expressions: AdaptiveExpressionInput[], blocks: UpgradedHtmlBlockInput[]): string {
  const types = expressions.map((expression) => expression.type);

  if (types.length > 0) {
    return types.join(",");
  }

  return blocks.length > 0 ? blocks.map((block) => `block:${block.type}`).join(",") : "none";
}

export async function renderAdaptiveThemeInlineHtmlFragment(input: AdaptiveThemeHtmlPageInput): Promise<string> {
  const context = resolveAdaptiveContext(input);
  const { profile, theme, strategy } = context;
  const expressions = getResolvedExpressions(input, context);
  const expressionHtml = expressions.map((expression, index) => renderAdaptiveExpression(expression, context, index === 0));
  const blockHtml = input.blocks.map((block, index) => renderAdaptiveBlock(block, context, expressionHtml.length === 0 && index === 0));
  const html = `<div data-html-render-mcp="adaptive-theme-inline" data-content-types="${escapeAttribute(
    input.contentTypes.join(",")
  )}" data-style-profile="${escapeAttribute(profile)}" data-expression-strategy="${escapeAttribute(strategy)}" data-expression-types="${escapeAttribute(
    getExpressionTypes(expressions, input.blocks)
  )}" style="${escapeAttribute(
    style({
      margin: "16px 0",
      background: theme.outerBackground,
      color: theme.text,
      border: theme.borderCss,
      "border-radius": theme.radius,
      "box-shadow": theme.shadow,
      "font-family": theme.fontFamily,
      "line-height": 1.65,
      "max-width": "100%",
      overflow: "hidden"
    })
  )}">
    ${expressionHtml.join("")}
    ${blockHtml.join("")}
    ${renderFooter(input.footer, theme)}
  </div>`;

  return formatHtml(html);
}
