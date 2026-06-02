import type { UpgradedHtmlBlockInput } from "../../schemas/upgradedHtmlPageSchema.js";
import type { UpgradedInlineThemeTokens } from "../../styles/upgraded/index.js";
import { escapeAttribute, escapeHtml } from "../../utils/escapeHtml.js";
import { normalizeRenderableHref } from "../../utils/normalizeRenderableHref.js";
import { renderParagraphGroup } from "../shared/paragraph.js";
import { style } from "../shared/style.js";

export function bodyTextStyle(
  theme: UpgradedInlineThemeTokens,
  overrides: Record<string, string | number | undefined> = {}
): string {
  return style({ margin: 0, "font-size": theme.bodyFontSize, color: theme.muted, "line-height": 1.65, ...overrides });
}

export function renderBodyText(value: unknown, theme: UpgradedInlineThemeTokens): string {
  return renderParagraphGroup(value, {
    singleStyle: bodyTextStyle(theme),
    multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "10px" }),
    multiParagraphStyle: bodyTextStyle(theme)
  });
}

export function renderCta(cta: { label: string; href?: string } | undefined, theme: UpgradedInlineThemeTokens): string {
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

export function renderBlockHeading(title: string | undefined, intro: string | undefined, theme: UpgradedInlineThemeTokens): string {
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

export function renderMetricCard(item: { label: string; value: string; detail?: string }, theme: UpgradedInlineThemeTokens): string {
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

export function renderTitledBodyCards(items: Array<{ title: string; body: string }>, theme: UpgradedInlineThemeTokens): string {
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

export function renderSectionShell(
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
