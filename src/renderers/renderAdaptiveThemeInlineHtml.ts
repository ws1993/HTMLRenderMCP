import type { AdaptiveThemeHtmlPageInput } from "../schemas/adaptiveThemeHtmlPageSchema.js";
import { escapeAttribute } from "../utils/escapeHtml.js";
import { formatHtml } from "../utils/formatHtml.js";
import { resolveAdaptiveContext } from "./adaptive/adaptiveContext.js";
import { renderAdaptiveBlock } from "./adaptive/blocks.js";
import { renderAdaptiveExpression } from "./adaptive/expressions.js";
import { getExpressionTypes, getResolvedExpressions } from "./adaptive/expressionResolution.js";
import { style } from "./shared/style.js";
import { renderFooter } from "./upgraded/footer.js";

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
