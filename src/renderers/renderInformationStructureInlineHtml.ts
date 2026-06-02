import {
  informationStructureHtmlPageSchema,
  type InformationStructureHtmlPageInput
} from "../schemas/informationStructureHtmlPageSchema.js";
import { escapeAttribute } from "../utils/escapeHtml.js";
import { formatHtml } from "../utils/formatHtml.js";
import { resolveAdaptiveContext } from "./adaptive/adaptiveContext.js";
import { renderAdaptiveBlock } from "./adaptive/blocks.js";
import { renderAdaptiveExpression } from "./adaptive/expressions.js";
import { getExpressionTypes, getResolvedExpressions } from "./adaptive/expressionResolution.js";
import { resolveInformationStructure, toAdaptiveThemePage } from "./informationStructure/structureResolution.js";
import { style } from "./shared/style.js";
import { renderFooter } from "./upgraded/footer.js";

export async function renderInformationStructureInlineHtmlFragment(input: InformationStructureHtmlPageInput): Promise<string> {
  const page = informationStructureHtmlPageSchema.parse(input);
  const resolvedStructure = resolveInformationStructure(page);
  const adaptiveInput = toAdaptiveThemePage(page);
  const context = resolveAdaptiveContext(adaptiveInput);
  const { profile, theme, strategy } = context;
  const expressions = getResolvedExpressions(adaptiveInput, context);
  const expressionHtml = expressions.map((expression, index) => renderAdaptiveExpression(expression, context, index === 0));
  const blockHtml = adaptiveInput.blocks.map((block, index) =>
    renderAdaptiveBlock(block, context, expressionHtml.length === 0 && index === 0)
  );
  const html = `<div data-html-render-mcp="information-structure-inline" data-information-structure="${escapeAttribute(
    resolvedStructure
  )}" data-content-types="${escapeAttribute(adaptiveInput.contentTypes.join(","))}" data-style-profile="${escapeAttribute(
    profile
  )}" data-expression-strategy="${escapeAttribute(strategy)}" data-expression-types="${escapeAttribute(
    getExpressionTypes(expressions, adaptiveInput.blocks)
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
    ${renderFooter(adaptiveInput.footer, theme)}
  </div>`;

  return formatHtml(html);
}
