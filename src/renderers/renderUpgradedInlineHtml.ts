import type { HtmlTheme } from "../schemas/htmlPageSchema.js";
import type {
  UpgradedDesignTokensInput,
  UpgradedHtmlBlockInput,
  UpgradedHtmlPageInput
} from "../schemas/upgradedHtmlPageSchema.js";
import { escapeAttribute, escapeHtml } from "../utils/escapeHtml.js";
import { formatHtml } from "../utils/formatHtml.js";
import { normalizeRenderableHref } from "../utils/normalizeRenderableHref.js";
import { renderInlineRichTextParagraphs } from "../utils/renderInlineRichText.js";

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

export function style(rules: Record<string, string | number | undefined>): string {
  return Object.entries({
    ...rules,
    "text-align": "left !important",
    "text-indent": "0 !important",
    "white-space": "normal !important"
  })
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");
}

function resolveTheme(themeName: HtmlTheme, tokens: UpgradedDesignTokensInput): UpgradedInlineThemeTokens {
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

function bodyTextStyle(theme: UpgradedInlineThemeTokens, overrides: Record<string, string | number | undefined> = {}): string {
  return style({ margin: 0, "font-size": theme.bodyFontSize, color: theme.muted, "line-height": 1.65, ...overrides });
}

function renderBodyText(value: unknown, theme: UpgradedInlineThemeTokens): string {
  return renderParagraphGroup(value, {
    singleStyle: bodyTextStyle(theme),
    multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "10px" }),
    multiParagraphStyle: bodyTextStyle(theme)
  });
}

function renderCta(cta: { label: string; href?: string } | undefined, theme: UpgradedInlineThemeTokens): string {
  const href = normalizeRenderableHref(cta?.href);

  if (!cta || !href) {
    return "";
  }

  return `<a href="${escapeAttribute(href)}" style="${escapeAttribute(
    style({
      display: "inline-block",
      "margin-top": "16px",
      padding: "9px 16px",
      background: theme.primary,
      color: "#ffffff",
      "text-decoration": "none",
      "border-radius": theme.radius === "0" ? "6px" : theme.radius,
      "font-size": theme.smallFontSize,
      "font-weight": 700
    })
  )}">${escapeHtml(cta.label)}</a>`;
}

function renderBlockHeading(title: string | undefined, intro: string | undefined, theme: UpgradedInlineThemeTokens): string {
  if (!title && !intro) {
    return "";
  }

  return `<div style="${escapeAttribute(style({ "margin-bottom": theme.gap }))}">
    ${title
      ? `<h2 style="${escapeAttribute(
          style({ margin: "0 0 8px 0", "font-size": theme.h2FontSize, "font-weight": 750, color: theme.text, "line-height": 1.35 })
        )}">${escapeHtml(title)}</h2>`
      : ""}
    ${intro ? renderBodyText(intro, theme) : ""}
  </div>`;
}

function renderMetricCard(item: { label: string; value: string; detail?: string }, theme: UpgradedInlineThemeTokens): string {
  return `<div style="${escapeAttribute(
    style({
      padding: theme.cardPadding,
      background: theme.panel,
      border: `1px solid ${theme.borderSubtle}`,
      "border-radius": theme.radiusSmall
    })
  )}">
    <div style="${escapeAttribute(style({ "font-size": theme.h2FontSize, "font-weight": 800, color: theme.primary, "line-height": 1.2 }))}">${escapeHtml(item.value)}</div>
    <div style="${escapeAttribute(style({ "margin-top": "4px", "font-size": theme.smallFontSize, "font-weight": 700, color: theme.text }))}">${escapeHtml(item.label)}</div>
    ${item.detail ? renderBodyText(item.detail, theme) : ""}
  </div>`;
}

function renderTitledBodyCards(items: Array<{ title: string; body: string }>, theme: UpgradedInlineThemeTokens): string {
  return `<div style="${escapeAttribute(
    style({ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(210px, 1fr))", gap: theme.gap })
  )}">
    ${items
      .map(
        (item) => `<article style="${escapeAttribute(
          style({ padding: theme.cardPadding, background: theme.panel, border: `1px solid ${theme.borderSubtle}`, "border-radius": theme.radiusSmall })
        )}">
          <h3 style="${escapeAttribute(style({ margin: "0 0 6px 0", "font-size": theme.h3FontSize, "font-weight": 750, color: theme.text }))}">${escapeHtml(item.title)}</h3>
          ${renderBodyText(item.body, theme)}
        </article>`
      )
      .join("")}
  </div>`;
}

function renderSectionShell(
  block: UpgradedHtmlBlockInput,
  innerHtml: string,
  theme: UpgradedInlineThemeTokens,
  isFirst: boolean
): string {
  return `<div data-block-type="${escapeAttribute(block.type)}" style="${escapeAttribute(
    style({
      padding: theme.sectionPadding,
      background: theme.surface,
      "border-top": isFirst ? "none" : `1px solid ${theme.borderSubtle}`
    })
  )}">${innerHtml}</div>`;
}

function renderHero(block: Extract<UpgradedHtmlBlockInput, { type: "hero" }>, theme: UpgradedInlineThemeTokens): string {
  const highlights = block.highlights?.length
    ? `<div style="${escapeAttribute(
        style({ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(150px, 1fr))", gap: theme.gap, "margin-top": "16px" })
      )}">${block.highlights.map((item) => renderMetricCard(item, theme)).join("")}</div>`
    : "";
  const meta = block.meta?.length
    ? `<div style="${escapeAttribute(style({ display: "flex", "flex-wrap": "wrap", gap: "8px", "margin-top": "12px" }))}">
        ${block.meta
          .map(
            (item) => `<span style="${escapeAttribute(
              style({ padding: "4px 8px", background: theme.primarySoft, color: theme.primary, "border-radius": "999px", "font-size": theme.smallFontSize, "font-weight": 700 })
            )}">${escapeHtml(item)}</span>`
          )
          .join("")}
      </div>`
    : "";

  return `<div style="${escapeAttribute(
    style({
      padding: theme.sectionPadding,
      background: `linear-gradient(135deg, ${theme.surface}, ${theme.primarySoft})`,
      "border-top": "none"
    })
  )}">
    ${block.eyebrow
      ? `<div style="${escapeAttribute(style({ "font-size": theme.smallFontSize, "font-weight": 800, color: theme.primary, "letter-spacing": "0.04em", "text-transform": "uppercase", "margin-bottom": "8px" }))}">${escapeHtml(block.eyebrow)}</div>`
      : ""}
    <h1 style="${escapeAttribute(
      style({ margin: "0", "font-size": theme.h1FontSize, "font-weight": 850, color: theme.text, "line-height": 1.25, "letter-spacing": "-0.02em" })
    )}">${escapeHtml(block.title)}</h1>
    ${block.subtitle
      ? renderParagraphGroup(block.subtitle, {
          singleStyle: bodyTextStyle(theme, { "margin-top": "10px", color: theme.muted }),
          multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "10px", "margin-top": "10px" }),
          multiParagraphStyle: bodyTextStyle(theme, { color: theme.muted })
        })
      : ""}
    ${meta}
    ${highlights}
    ${renderCta(block.cta, theme)}
  </div>`;
}

function renderTimeline(block: Extract<UpgradedHtmlBlockInput, { type: "timeline" }>, theme: UpgradedInlineThemeTokens): string {
  return `${renderBlockHeading(block.title, block.intro, theme)}
    <div style="${escapeAttribute(style({ display: "flex", "flex-direction": "column" }))}">
      ${block.items
        .map(
          (item, index) => `<div style="${escapeAttribute(style({ display: "flex", gap: "14px" }))}">
            <div style="${escapeAttribute(style({ display: "flex", "flex-direction": "column", "align-items": "center" }))}">
              <div style="${escapeAttribute(
                style({ width: "28px", height: "28px", "border-radius": "999px", background: theme.primarySoft, color: theme.primary, display: "flex", "align-items": "center", "justify-content": "center", "font-size": theme.smallFontSize, "font-weight": 800, border: `1px solid ${theme.borderSubtle}`, "flex-shrink": 0 })
              )}">${index + 1}</div>
              ${index < block.items.length - 1 ? `<div style="${escapeAttribute(style({ width: "2px", height: "100%", background: theme.borderSubtle, "min-height": "18px", margin: "4px 0" }))}"></div>` : ""}
            </div>
            <div style="${escapeAttribute(style({ "padding-bottom": index < block.items.length - 1 ? "16px" : "0", "padding-top": "2px" }))}">
              ${item.time ? `<div style="${escapeAttribute(style({ "font-size": theme.smallFontSize, color: theme.primary, "font-weight": 750, "margin-bottom": "2px" }))}">${escapeHtml(item.time)}</div>` : ""}
              <h3 style="${escapeAttribute(style({ margin: "0 0 4px 0", "font-size": theme.h3FontSize, "font-weight": 750, color: theme.text }))}">${escapeHtml(item.title)}</h3>
              ${renderBodyText(item.body, theme)}
            </div>
          </div>`
        )
        .join("")}
    </div>`;
}

function renderComparisonTable(block: Extract<UpgradedHtmlBlockInput, { type: "comparison-table" }>, theme: UpgradedInlineThemeTokens): string {
  const hasRowLabels = block.rows.some((row) => row.label);
  const headerCells = (hasRowLabels ? ["Dimension", ...block.columns] : block.columns)
    .map(
      (column) => `<th style="${escapeAttribute(
        style({ padding: "10px", background: theme.primarySoft, color: theme.text, border: `1px solid ${theme.borderSubtle}`, "font-size": theme.smallFontSize, "font-weight": 800 })
      )}">${escapeHtml(column)}</th>`
    )
    .join("");

  return `${renderBlockHeading(block.title, block.intro, theme)}
    <div style="${escapeAttribute(style({ overflow: "auto", "max-width": "100%" }))}">
      <table style="${escapeAttribute(style({ width: "100%", "border-collapse": "collapse", "font-size": theme.bodyFontSize, color: theme.text }))}">
        <thead><tr>${headerCells}</tr></thead>
        <tbody>
          ${block.rows
            .map(
              (row) => `<tr>
                ${hasRowLabels
                  ? `<th style="${escapeAttribute(style({ padding: "10px", border: `1px solid ${theme.borderSubtle}`, background: theme.panel, color: theme.text, "font-weight": 750, "vertical-align": "top" }))}">${escapeHtml(row.label ?? "")}</th>`
                  : ""}
                ${row.cells
                  .map(
                    (cell) => `<td style="${escapeAttribute(style({ padding: "10px", border: `1px solid ${theme.borderSubtle}`, color: theme.muted, "vertical-align": "top" }))}">${renderParagraphGroup(cell, {
                      singleTag: "div",
                      singleStyle: bodyTextStyle(theme),
                      multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "8px" }),
                      multiParagraphStyle: bodyTextStyle(theme)
                    })}</td>`
                  )
                  .join("")}
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderRiskBox(block: Extract<UpgradedHtmlBlockInput, { type: "risk-box" }>, theme: UpgradedInlineThemeTokens): string {
  const severityStyles = {
    low: { bg: "#ecfdf5", text: "#047857", label: "LOW" },
    medium: { bg: "#fffbeb", text: "#b45309", label: "MED" },
    high: { bg: "#fef2f2", text: "#b91c1c", label: "HIGH" }
  } as const;

  return `${renderBlockHeading(block.title, block.intro, theme)}
    <div style="${escapeAttribute(style({ display: "flex", "flex-direction": "column", gap: theme.gap }))}">
      ${block.items
        .map((item) => {
          const severity = severityStyles[item.severity ?? "medium"];

          return `<article style="${escapeAttribute(
            style({ padding: theme.cardPadding, background: theme.panel, border: `1px solid ${theme.borderSubtle}`, "border-left": `4px solid ${severity.text}`, "border-radius": theme.radiusSmall })
          )}">
            <div style="${escapeAttribute(style({ display: "flex", "align-items": "center", gap: "8px", "margin-bottom": "6px" }))}">
              <span style="${escapeAttribute(style({ padding: "2px 6px", background: severity.bg, color: severity.text, "border-radius": "999px", "font-size": "11px", "font-weight": 800 }))}">${severity.label}</span>
              <h3 style="${escapeAttribute(style({ margin: 0, "font-size": theme.h3FontSize, "font-weight": 750, color: theme.text }))}">${escapeHtml(item.title)}</h3>
            </div>
            ${renderBodyText(item.body, theme)}
          </article>`;
        })
        .join("")}
    </div>`;
}

function renderSourceList(block: Extract<UpgradedHtmlBlockInput, { type: "source-list" }>, theme: UpgradedInlineThemeTokens): string {
  return `${renderBlockHeading(block.title, block.intro, theme)}
    <div style="${escapeAttribute(style({ display: "flex", "flex-direction": "column", gap: "8px" }))}">
      ${block.items
        .map((item, index) => {
          const href = normalizeRenderableHref(item.href);
          const label = href
            ? `<a href="${escapeAttribute(href)}" style="${escapeAttribute(style({ color: theme.primary, "font-weight": 750, "text-decoration": "none" }))}">${escapeHtml(item.label)}</a>`
            : `<span style="${escapeAttribute(style({ color: theme.text, "font-weight": 750 }))}">${escapeHtml(item.label)}</span>`;

          return `<div style="${escapeAttribute(style({ display: "flex", gap: "10px", padding: "10px", background: theme.panel, border: `1px solid ${theme.borderSubtle}`, "border-radius": theme.radiusSmall }))}">
            <span style="${escapeAttribute(style({ color: theme.primary, "font-weight": 800, "font-size": theme.smallFontSize }))}">${index + 1}</span>
            <div>${label}${item.description ? renderBodyText(item.description, theme) : ""}</div>
          </div>`;
        })
        .join("")}
    </div>`;
}

function renderCallout(block: Extract<UpgradedHtmlBlockInput, { type: "callout" }>, theme: UpgradedInlineThemeTokens): string {
  const toneMap = {
    neutral: { bg: theme.panel, border: theme.borderSubtle, text: theme.text },
    info: { bg: theme.primarySoft, border: theme.primary, text: theme.primary },
    success: { bg: "#ecfdf5", border: "#10b981", text: "#047857" },
    warning: { bg: "#fffbeb", border: "#f59e0b", text: "#b45309" },
    danger: { bg: "#fef2f2", border: "#ef4444", text: "#b91c1c" }
  } as const;
  const tone = toneMap[block.tone];

  return `<div style="${escapeAttribute(
    style({ padding: theme.cardPadding, background: tone.bg, border: `1px solid ${tone.border}`, "border-left": `4px solid ${tone.border}`, "border-radius": theme.radiusSmall })
  )}">
    ${block.title ? `<h3 style="${escapeAttribute(style({ margin: "0 0 6px 0", "font-size": theme.h3FontSize, "font-weight": 800, color: tone.text }))}">${escapeHtml(block.title)}</h3>` : ""}
    ${renderParagraphGroup(block.body, {
      singleTag: "div",
      singleStyle: bodyTextStyle(theme, { color: theme.text }),
      multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "8px" }),
      multiParagraphStyle: bodyTextStyle(theme, { color: theme.text })
    })}
  </div>`;
}

export function renderBlock(block: UpgradedHtmlBlockInput, theme: UpgradedInlineThemeTokens, isFirst: boolean): string {
  switch (block.type) {
    case "hero":
      return renderHero(block, theme);

    case "summary-card":
      return renderSectionShell(
        block,
        `${renderBlockHeading(block.title, undefined, theme)}${renderParagraphGroup(block.body, {
          singleTag: "div",
          singleStyle: bodyTextStyle(theme, { color: theme.text, background: theme.panel, padding: theme.cardPadding, border: `1px solid ${theme.borderSubtle}`, "border-radius": theme.radiusSmall }),
          multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "10px", background: theme.panel, padding: theme.cardPadding, border: `1px solid ${theme.borderSubtle}`, "border-radius": theme.radiusSmall }),
          multiParagraphStyle: bodyTextStyle(theme, { color: theme.text })
        })}${block.items?.length ? `<div style="${escapeAttribute(style({ "margin-top": theme.gap }))}">${renderTitledBodyCards(block.items, theme)}</div>` : ""}`,
        theme,
        isFirst
      );

    case "timeline":
      return renderSectionShell(block, renderTimeline(block, theme), theme, isFirst);

    case "stat-grid":
      return renderSectionShell(
        block,
        `${renderBlockHeading(block.title, block.intro, theme)}<div style="${escapeAttribute(
          style({ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(150px, 1fr))", gap: theme.gap })
        )}">${block.items.map((item) => renderMetricCard(item, theme)).join("")}</div>`,
        theme,
        isFirst
      );

    case "comparison-table":
      return renderSectionShell(block, renderComparisonTable(block, theme), theme, isFirst);

    case "quote":
      return renderSectionShell(
        block,
        `<blockquote style="${escapeAttribute(
          style({ margin: 0, padding: theme.cardPadding, background: theme.panel, border: `1px solid ${theme.borderSubtle}`, "border-left": `4px solid ${theme.accent}`, "border-radius": theme.radiusSmall, color: theme.text })
        )}">${renderParagraphGroup(block.text, {
          singleTag: "div",
          singleStyle: bodyTextStyle(theme, { color: theme.text, "font-size": theme.h3FontSize }),
          multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "8px" }),
          multiParagraphStyle: bodyTextStyle(theme, { color: theme.text, "font-size": theme.h3FontSize })
        })}${block.source ? `<footer style="${escapeAttribute(style({ "margin-top": "10px", color: theme.muted, "font-size": theme.smallFontSize }))}">- ${escapeHtml(block.source)}</footer>` : ""}</blockquote>`,
        theme,
        isFirst
      );

    case "risk-box":
      return renderSectionShell(block, renderRiskBox(block, theme), theme, isFirst);

    case "faq":
      return renderSectionShell(
        block,
        `${renderBlockHeading(block.title, undefined, theme)}<div style="${escapeAttribute(style({ display: "flex", "flex-direction": "column", gap: "8px" }))}">${block.items
          .map(
            (item) => `<details style="${escapeAttribute(style({ padding: theme.cardPadding, background: theme.panel, border: `1px solid ${theme.borderSubtle}`, "border-radius": theme.radiusSmall }))}">
              <summary style="${escapeAttribute(style({ cursor: "pointer", color: theme.text, "font-size": theme.h3FontSize, "font-weight": 750 }))}">${escapeHtml(item.question)}</summary>
              <div style="${escapeAttribute(style({ "margin-top": "10px", "padding-top": "10px", "border-top": `1px dashed ${theme.borderSubtle}` }))}">${renderBodyText(item.answer, theme)}</div>
            </details>`
          )
          .join("")}</div>`,
        theme,
        isFirst
      );

    case "steps":
      return renderSectionShell(block, `${renderBlockHeading(block.title, block.intro, theme)}${renderTitledBodyCards(block.items, theme)}`, theme, isFirst);

    case "source-list":
      return renderSectionShell(block, renderSourceList(block, theme), theme, isFirst);

    case "callout":
      return renderSectionShell(block, renderCallout(block, theme), theme, isFirst);
  }
}

export function renderFooter(footer: UpgradedHtmlPageInput["footer"], theme: UpgradedInlineThemeTokens): string {
  if (!footer) {
    return "";
  }

  const links = footer.links?.length
    ? `<div style="${escapeAttribute(style({ display: "flex", "flex-wrap": "wrap", gap: "10px", "margin-top": "10px" }))}">${footer.links
        .map((link) => {
          const href = normalizeRenderableHref(link.href);

          if (!href) {
            return "";
          }

          return `<a href="${escapeAttribute(href)}" style="${escapeAttribute(style({ color: theme.primary, "font-weight": 700, "font-size": theme.smallFontSize, "text-decoration": "none" }))}">${escapeHtml(link.label)}</a>`;
        })
        .join("")}</div>`
    : "";

  return `<div style="${escapeAttribute(
    style({ padding: "16px 24px", background: theme.bg, "border-top": `1px solid ${theme.borderSubtle}`, color: theme.muted, "font-size": theme.smallFontSize })
  )}">${footer.text ? renderBodyText(footer.text, theme) : ""}${links}</div>`;
}

export async function renderUpgradedInlineHtmlFragment(input: UpgradedHtmlPageInput): Promise<string> {
  const theme = resolveTheme(input.theme, input.tokens);
  const html = `<div data-html-render-mcp="upgraded-inline" data-content-types="${escapeAttribute(
    input.contentTypes.join(",")
  )}" style="${escapeAttribute(
    style({
      margin: "16px 0",
      background: theme.surface,
      color: theme.text,
      border: theme.borderCss,
      "border-radius": theme.radius,
      "box-shadow": theme.shadow,
      "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
      "line-height": 1.6,
      "max-width": "100%",
      overflow: "hidden"
    })
  )}">
    ${input.blocks.map((block, index) => renderBlock(block, theme, index === 0)).join("")}
    ${renderFooter(input.footer, theme)}
  </div>`;

  return formatHtml(html);
}
