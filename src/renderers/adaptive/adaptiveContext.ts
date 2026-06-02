import type {
  AdaptiveExpressionConfigInput,
  AdaptiveThemeHtmlPageInput
} from "../../schemas/adaptiveThemeHtmlPageSchema.js";
import {
  resolveAdaptiveExpressionStrategy,
  resolveAdaptiveStyleProfile,
  resolveAdaptiveProfileDefinition,
  type AdaptiveInlineThemeTokens,
  type AdaptiveProfileDefinition,
  type ResolvedAdaptiveExpressionStrategy,
  type ResolvedAdaptiveStyleProfile
} from "../../styles/adaptive/index.js";

export interface AdaptiveRenderContext {
  profile: ResolvedAdaptiveStyleProfile;
  theme: AdaptiveInlineThemeTokens;
  definition: AdaptiveProfileDefinition;
  strategy: ResolvedAdaptiveExpressionStrategy;
  expression: AdaptiveExpressionConfigInput;
}

export function resolveAdaptiveContext(input: AdaptiveThemeHtmlPageInput): AdaptiveRenderContext {
  const profile = resolveAdaptiveStyleProfile(input.contentTypes, input.styleProfile);
  const definition = resolveAdaptiveProfileDefinition(profile, input.tokens);
  const strategy = resolveAdaptiveExpressionStrategy(input.expression, definition);
  const { theme } = definition;

  return {
    profile,
    theme,
    definition,
    strategy,
    expression: input.expression
  };
}
