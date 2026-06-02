import type { AdaptiveInlineThemeTokens } from "../../styles/adaptive/index.js";
import { escapeAttribute, escapeHtml } from "../../utils/escapeHtml.js";
import { renderParagraphGroup } from "../shared/paragraph.js";
import { style } from "../shared/style.js";
import type { AdaptiveRenderContext } from "./adaptiveContext.js";

export function bodyTextStyle(
  theme: AdaptiveInlineThemeTokens,
  overrides: Record<string, string | number | undefined> = {}
): string {
  return style({ margin: 0, "font-size": theme.bodyFontSize, color: theme.muted, "line-height": 1.68, ...overrides });
}

export function renderBodyText(value: unknown, theme: AdaptiveInlineThemeTokens, color = theme.muted): string {
  return renderParagraphGroup(value, {
    singleStyle: bodyTextStyle(theme, { color }),
    multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "10px" }),
    multiParagraphStyle: bodyTextStyle(theme, { color })
  });
}

export function renderAdaptiveSection(
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

export function renderEyebrow(value: string | undefined, context: AdaptiveRenderContext): string {
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

export function renderSectionHeading(title: string | undefined, intro: string | undefined, context: AdaptiveRenderContext): string {
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

export function renderFactStrip(
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

export function renderSimpleList(items: string[] | undefined, context: AdaptiveRenderContext, ordered = false): string {
  if (!items?.length) {
    return "";
  }

  const { theme } = context;
  const tag = ordered ? "ol" : "ul";

  return `<${tag} style="${escapeAttribute(
    style({ margin: "10px 0 0 0", padding: ordered ? "0 0 0 22px" : "0 0 0 18px", color: theme.muted, "font-size": theme.bodyFontSize, "line-height": 1.65 })
  )}">${items.map((item) => `<li style="${escapeAttribute(style({ margin: "4px 0" }))}">${escapeHtml(item)}</li>`).join("")}</${tag}>`;
}

export function renderTitledRows(
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
