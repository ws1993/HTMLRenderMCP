import type { UpgradedHtmlPageInput } from "../../schemas/upgradedHtmlPageSchema.js";
import type { UpgradedInlineThemeTokens } from "../../styles/upgraded/index.js";
import { escapeAttribute, escapeHtml } from "../../utils/escapeHtml.js";
import { normalizeRenderableHref } from "../../utils/normalizeRenderableHref.js";
import { style } from "../shared/style.js";
import { renderBodyText } from "./renderHelpers.js";

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
