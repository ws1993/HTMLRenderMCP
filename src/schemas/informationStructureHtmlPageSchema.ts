import { z } from "zod";
import {
  adaptiveExpressionConfigSchema,
  adaptiveExpressionSchema,
  adaptiveExpressionStrategySchema,
  adaptiveStyleProfileSchema
} from "./adaptiveThemeHtmlPageSchema.js";
import { footerSchema } from "./htmlPageSchema.js";
import {
  upgradedContentTypeSchema,
  upgradedDesignTokensSchema,
  upgradedHtmlBlockSchema
} from "./upgradedHtmlPageSchema.js";

const informationStructures = ["auto", "news", "research", "explain", "compare", "tutorial", "list", "opinion"] as const;

const structureDescriptions = {
  news: "Inverted pyramid for facts, lead, context, and optional follow-up details.",
  research: "IMRaD-style report with executive summary, method transparency, findings, discussion, and sources.",
  explain: "Hook, analogy, principle, evidence, and meaning for accessible explainers.",
  compare: "Criteria matrix, per-dimension evaluation, pros/cons, and scenario recommendation.",
  tutorial: "Outcome-first steps with prerequisites, checks, troubleshooting, and next actions.",
  list: "Selection criteria, ranked catalog, per-item review, comparison, and choosing guidance.",
  opinion: "Thesis, evidence, counterargument, synthesis, deeper insight, and closing stance."
} as const;

export const informationStructureSchema = z.enum(informationStructures);

export const informationStructureHtmlPageSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    lang: z.string().default("zh-CN"),
    structure: informationStructureSchema.default("auto"),
    contentTypes: z.array(upgradedContentTypeSchema).min(1, "At least one content type is required").optional(),
    styleProfile: adaptiveStyleProfileSchema.default("auto"),
    expression: adaptiveExpressionConfigSchema,
    expressions: z.array(adaptiveExpressionSchema).default([]),
    tokens: upgradedDesignTokensSchema,
    blocks: z.array(upgradedHtmlBlockSchema).default([]),
    footer: footerSchema
  })
  .superRefine((page, context) => {
    const hasConfigExpression = Boolean(page.expression?.coreViewpoint || page.expression?.keyTakeaways?.length);

    if (page.blocks.length === 0 && page.expressions.length === 0 && !hasConfigExpression) {
      context.addIssue({
        code: "custom",
        message: "At least one information expression or layout block is required",
        path: ["expressions"]
      });
    }
  });

export type InformationStructure = z.infer<typeof informationStructureSchema>;
export type ResolvedInformationStructure = Exclude<InformationStructure, "auto">;
export type InformationStructureHtmlPageInput = z.input<typeof informationStructureHtmlPageSchema>;
export type InformationStructureHtmlPageOutput = z.infer<typeof informationStructureHtmlPageSchema>;

export const availableInformationStructures = [...informationStructures];
export const informationStructureDescriptions = { ...structureDescriptions };

export const informationStructureStrategyByType: Record<ResolvedInformationStructure, z.infer<typeof adaptiveExpressionStrategySchema>> = {
  news: "inverted-pyramid",
  research: "academic",
  explain: "top-down",
  compare: "decision",
  tutorial: "workshop",
  list: "catalog",
  opinion: "argument"
};
