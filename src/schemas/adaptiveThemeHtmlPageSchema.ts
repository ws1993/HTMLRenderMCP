import { z } from "zod";
import { footerSchema } from "./htmlPageSchema.js";
import {
  upgradedContentTypeSchema,
  upgradedDesignTokensSchema,
  upgradedHtmlBlockSchema
} from "./upgradedHtmlPageSchema.js";

const adaptiveStyleProfiles = [
  "auto",
  "old-newspaper",
  "academic-journal",
  "clean-magazine",
  "decision-brief",
  "workshop-guide",
  "curated-list",
  "editorial-column"
] as const;

export const adaptiveStyleProfileSchema = z.enum(adaptiveStyleProfiles);

const adaptiveExpressionStrategies = [
  "auto",
  "top-down",
  "inverted-pyramid",
  "decision",
  "academic",
  "workshop",
  "argument",
  "catalog"
] as const;

const adaptiveExpressionEmphases = [
  "core-viewpoint",
  "recommendation",
  "evidence",
  "comparison",
  "process",
  "sources"
] as const;

const adaptiveExpressionTypes = [
  "lead",
  "key-takeaways",
  "executive-summary",
  "evidence-map",
  "decision-matrix",
  "argument-map",
  "process-guide",
  "ranked-list",
  "section-outline"
] as const;

export const adaptiveExpressionStrategySchema = z.enum(adaptiveExpressionStrategies);
export const adaptiveExpressionEmphasisSchema = z.enum(adaptiveExpressionEmphases);

const optionalStringArraySchema = z.array(z.string().min(1)).optional();

const titledBodyExpressionItemSchema = z.object({
  title: z.string().min(1, "Item title is required"),
  body: z.string().optional()
});

const factExpressionItemSchema = z.object({
  label: z.string().min(1, "Fact label is required"),
  value: z.string().min(1, "Fact value is required"),
  detail: z.string().optional()
});

export const adaptiveExpressionConfigSchema = z
  .object({
    strategy: adaptiveExpressionStrategySchema.default("auto"),
    emphasis: adaptiveExpressionEmphasisSchema.optional(),
    density: z.enum(["narrative", "balanced", "compact"]).default("balanced"),
    hierarchy: z.enum(["strong", "normal", "flat"]).default("normal"),
    coreViewpoint: z.string().optional(),
    keyTakeaways: optionalStringArraySchema
  })
  .optional();

export const adaptiveExpressionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("lead"),
    eyebrow: z.string().optional(),
    title: z.string().optional(),
    body: z.string().min(1, "Lead body is required"),
    facts: z.array(factExpressionItemSchema).optional()
  }),
  z.object({
    type: z.literal("key-takeaways"),
    title: z.string().optional(),
    intro: z.string().optional(),
    items: z.array(titledBodyExpressionItemSchema).min(1, "At least one takeaway is required")
  }),
  z.object({
    type: z.literal("executive-summary"),
    title: z.string().optional(),
    ask: z.string().optional(),
    recommendation: z.string().min(1, "Recommendation is required"),
    decisionHeadlines: optionalStringArraySchema,
    rationale: z.string().optional(),
    impact: z.string().optional()
  }),
  z.object({
    type: z.literal("evidence-map"),
    title: z.string().optional(),
    claim: z.string().min(1, "Claim is required"),
    evidence: z
      .array(
        titledBodyExpressionItemSchema.extend({
          confidence: z.enum(["low", "medium", "high"]).optional()
        })
      )
      .min(1, "At least one evidence item is required"),
    limitations: optionalStringArraySchema
  }),
  z.object({
    type: z.literal("decision-matrix"),
    title: z.string().min(1, "Decision matrix title is required"),
    intro: z.string().optional(),
    recommendation: z.string().optional(),
    criteria: z.array(z.string().min(1, "Criterion is required")).min(1, "At least one criterion is required"),
    options: z
      .array(
        z.object({
          name: z.string().min(1, "Option name is required"),
          verdict: z.enum(["recommended", "acceptable", "risky", "reject"]).optional(),
          scores: z.array(z.string()).optional(),
          rationale: z.string().optional()
        })
      )
      .min(1, "At least one option is required")
  }),
  z.object({
    type: z.literal("argument-map"),
    title: z.string().optional(),
    claim: z.string().min(1, "Claim is required"),
    reasons: z.array(titledBodyExpressionItemSchema).min(1, "At least one reason is required"),
    counterarguments: z.array(titledBodyExpressionItemSchema).optional(),
    conclusion: z.string().optional()
  }),
  z.object({
    type: z.literal("process-guide"),
    title: z.string().min(1, "Process guide title is required"),
    goal: z.string().min(1, "Process guide goal is required"),
    prerequisites: optionalStringArraySchema,
    steps: z
      .array(
        titledBodyExpressionItemSchema.extend({
          checkpoint: z.string().optional(),
          output: z.string().optional()
        })
      )
      .min(1, "At least one process step is required"),
    checks: optionalStringArraySchema
  }),
  z.object({
    type: z.literal("ranked-list"),
    title: z.string().min(1, "Ranked list title is required"),
    intro: z.string().optional(),
    items: z
      .array(
        titledBodyExpressionItemSchema.extend({
          rank: z.union([z.string(), z.number()]).optional(),
          tags: optionalStringArraySchema,
          fit: z.string().optional()
        })
      )
      .min(1, "At least one ranked item is required")
  }),
  z.object({
    type: z.literal("section-outline"),
    title: z.string().min(1, "Section outline title is required"),
    intro: z.string().optional(),
    sections: z
      .array(
        titledBodyExpressionItemSchema.extend({
          children: z.array(titledBodyExpressionItemSchema).optional()
        })
      )
      .min(1, "At least one outline section is required")
  })
]);

export const adaptiveThemeHtmlPageSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    lang: z.string().default("zh-CN"),
    contentTypes: z.array(upgradedContentTypeSchema).min(1, "At least one content type is required").default(["news"]),
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
        message: "At least one adaptive expression or layout block is required",
        path: ["expressions"]
      });
    }
  });

export type AdaptiveStyleProfile = z.infer<typeof adaptiveStyleProfileSchema>;
export type AdaptiveExpressionStrategy = z.infer<typeof adaptiveExpressionStrategySchema>;
export type AdaptiveExpressionConfigInput = z.infer<typeof adaptiveExpressionConfigSchema>;
export type AdaptiveExpressionInput = z.infer<typeof adaptiveExpressionSchema>;
export type AdaptiveThemeHtmlPageInput = z.infer<typeof adaptiveThemeHtmlPageSchema>;

export const availableAdaptiveStyleProfiles = [...adaptiveStyleProfiles];
export const availableAdaptiveExpressionStrategies = [...adaptiveExpressionStrategies];
export const availableAdaptiveExpressionTypes = [...adaptiveExpressionTypes];
