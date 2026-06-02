import type { AdaptiveThemeHtmlPageInput } from "../../schemas/adaptiveThemeHtmlPageSchema.js";
import {
  informationStructureStrategyByType,
  type InformationStructureHtmlPageOutput,
  type ResolvedInformationStructure
} from "../../schemas/informationStructureHtmlPageSchema.js";
import type { UpgradedContentType } from "../../schemas/upgradedHtmlPageSchema.js";

const structurePriority: ResolvedInformationStructure[] = [
  "news",
  "opinion",
  "tutorial",
  "compare",
  "research",
  "explain",
  "list"
];

const structureByContentType: Record<UpgradedContentType, ResolvedInformationStructure> = {
  news: "news",
  research: "research",
  explain: "explain",
  compare: "compare",
  tutorial: "tutorial",
  list: "list",
  opinion: "opinion"
};

export function resolveInformationStructure(input: InformationStructureHtmlPageOutput): ResolvedInformationStructure {
  if (input.structure !== "auto") {
    return input.structure;
  }

  const contentTypes = input.contentTypes ?? [];

  for (const structure of structurePriority) {
    if (contentTypes.some((contentType) => structureByContentType[contentType] === structure)) {
      return structure;
    }
  }

  return "explain";
}

export function toAdaptiveThemePage(input: InformationStructureHtmlPageOutput): AdaptiveThemeHtmlPageInput {
  const resolvedStructure = resolveInformationStructure(input);
  const contentTypes = input.contentTypes?.length ? input.contentTypes : [resolvedStructure];
  const configuredStrategy = input.expression?.strategy;
  const expression: NonNullable<AdaptiveThemeHtmlPageInput["expression"]> = {
    ...(input.expression ?? {}),
    strategy:
      configuredStrategy && configuredStrategy !== "auto"
        ? configuredStrategy
        : informationStructureStrategyByType[resolvedStructure],
    density: input.expression?.density ?? "balanced",
    hierarchy: input.expression?.hierarchy ?? "normal"
  };

  return {
    title: input.title,
    description: input.description,
    lang: input.lang,
    contentTypes,
    styleProfile: input.styleProfile,
    expression,
    expressions: input.expressions,
    tokens: input.tokens,
    blocks: input.blocks,
    footer: input.footer
  };
}
