import type { UpgradedHtmlPageInput } from "../schemas/upgradedHtmlPageSchema.js";
import { resolveUpgradedInlineTheme } from "../styles/upgraded/index.js";
import { style } from "./shared/style.js";
import { escapeAttribute } from "../utils/escapeHtml.js";
import { formatHtml } from "../utils/formatHtml.js";
import { renderBlock } from "./upgraded/blocks.js";
import { renderFooter } from "./upgraded/footer.js";

export type { UpgradedInlineThemeTokens } from "../styles/upgraded/index.js";
export { renderBlock } from "./upgraded/blocks.js";
export { renderFooter } from "./upgraded/footer.js";
export { style };

export async function renderUpgradedInlineHtmlFragment(input: UpgradedHtmlPageInput): Promise<string> {
  const theme = resolveUpgradedInlineTheme(input.theme, input.tokens);
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
