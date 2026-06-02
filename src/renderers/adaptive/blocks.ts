import type { UpgradedHtmlBlockInput } from "../../schemas/upgradedHtmlPageSchema.js";
import { escapeAttribute, escapeHtml } from "../../utils/escapeHtml.js";
import { normalizeRenderableHref } from "../../utils/normalizeRenderableHref.js";
import { style } from "../shared/style.js";
import { renderBlock } from "../upgraded/blocks.js";
import type { AdaptiveRenderContext } from "./adaptiveContext.js";
import {
  renderAdaptiveSection,
  renderBodyText,
  renderEyebrow,
  renderFactStrip,
  renderSectionHeading,
  renderTitledRows
} from "./renderHelpers.js";

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

export function renderAdaptiveBlock(block: UpgradedHtmlBlockInput, context: AdaptiveRenderContext, isFirst: boolean): string {
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
