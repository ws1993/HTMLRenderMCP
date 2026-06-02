import type {
  AdaptiveExpressionInput,
  AdaptiveThemeHtmlPageInput
} from "../../schemas/adaptiveThemeHtmlPageSchema.js";
import type { UpgradedHtmlBlockInput } from "../../schemas/upgradedHtmlPageSchema.js";
import type { AdaptiveRenderContext } from "./adaptiveContext.js";

export function getResolvedExpressions(input: AdaptiveThemeHtmlPageInput, context: AdaptiveRenderContext): AdaptiveExpressionInput[] {
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

export function getExpressionTypes(expressions: AdaptiveExpressionInput[], blocks: UpgradedHtmlBlockInput[]): string {
  const types = expressions.map((expression) => expression.type);

  if (types.length > 0) {
    return types.join(",");
  }

  return blocks.length > 0 ? blocks.map((block) => `block:${block.type}`).join(",") : "none";
}
