import type { UpgradedHtmlBlockInput } from "../../schemas/upgradedHtmlPageSchema.js";
import type { UpgradedInlineThemeTokens } from "../../styles/upgraded/index.js";
import { escapeAttribute, escapeHtml } from "../../utils/escapeHtml.js";
import { normalizeRenderableHref } from "../../utils/normalizeRenderableHref.js";
import { renderParagraphGroup } from "../shared/paragraph.js";
import { style } from "../shared/style.js";
import {
  bodyTextStyle,
  renderBlockHeading,
  renderBodyText,
  renderCta,
  renderMetricCard,
  renderSectionShell,
  renderTitledBodyCards
} from "./renderHelpers.js";

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
