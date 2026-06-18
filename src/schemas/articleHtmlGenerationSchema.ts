import { z } from "zod";
import {
  adaptiveExpressionSchema,
  adaptiveStyleProfileSchema
} from "./adaptiveThemeHtmlPageSchema.js";
import {
  informationStructureSchema
} from "./informationStructureHtmlPageSchema.js";
import {
  upgradedHtmlBlockSchema
} from "./upgradedHtmlPageSchema.js";

export const articleTypeSchema = z.enum([
  "longform",
  "full-report",
  "tutorial",
  "explainer",
  "dialogue",
  "review",
  "essay",
  "briefing",
  "interactive-explainer"
]);

export const retentionTargetSchema = z.enum(["40-60%", "60-80%", "80-100%", "near-100%"]);

export const articleDiagnosticSchema = z.object({
  path: z.string(),
  code: z.string(),
  message: z.string(),
  fix: z.string(),
  severity: z.enum(["error", "warning"])
});

export const articleSectionPlanSchema = z.object({
  id: z.string().min(1, "Section id is required"),
  title: z.string().min(1, "Section title is required"),
  purpose: z.string().min(1, "Section purpose is required"),
  sourceCoverage: z.array(z.string().min(1)).default([]),
  expressionPlan: z.array(z.string().min(1)).default([]),
  visualPlan: z.string().optional(),
  acceptanceChecks: z.array(z.string().min(1)).default([])
});

export const articleGenerationPlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  articleType: articleTypeSchema.default("longform"),
  retentionTarget: retentionTargetSchema.default("80-100%"),
  audience: z.string().optional(),
  targetStructure: informationStructureSchema.exclude(["auto"]).default("explain"),
  styleProfile: adaptiveStyleProfileSchema.default("auto"),
  brief: z.object({
    purpose: z.string().default(""),
    coreViewpoint: z.string().default(""),
    readerOutcome: z.string().default("")
  }),
  sections: z.array(articleSectionPlanSchema).default([]),
  reviewChecklist: z.array(z.string().min(1)).default([])
});

export const articleSectionDraftSchema = z.object({
  sectionId: z.string().min(1, "Section id is required"),
  title: z.string().min(1, "Section title is required"),
  summary: z.string().min(1, "Section summary is required"),
  sourceCoverage: z.array(z.string().min(1)).default([]),
  expressions: z.array(adaptiveExpressionSchema).default([]),
  blocks: z.array(upgradedHtmlBlockSchema).default([]),
  reviewNotes: z.array(z.string().min(1)).optional()
});

export const articleGuidanceInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  sourceSummary: z.string().optional(),
  audience: z.string().optional(),
  articleType: articleTypeSchema.optional(),
  retentionTarget: retentionTargetSchema.optional(),
  targetStructure: informationStructureSchema.exclude(["auto"]).optional(),
  styleProfile: adaptiveStyleProfileSchema.optional()
});

export const articlePlanValidationInputSchema = z.object({
  plan: articleGenerationPlanSchema
});

export const articleSectionValidationInputSchema = z.object({
  plan: articleGenerationPlanSchema,
  draft: articleSectionDraftSchema
});

export const articleAssemblyInputSchema = z.object({
  plan: articleGenerationPlanSchema,
  sections: z.array(articleSectionDraftSchema)
});

export type ArticleType = z.infer<typeof articleTypeSchema>;
export type RetentionTarget = z.infer<typeof retentionTargetSchema>;
export type ArticleDiagnostic = z.infer<typeof articleDiagnosticSchema>;
export type ArticleSectionPlan = z.infer<typeof articleSectionPlanSchema>;
export type ArticleGenerationPlan = z.infer<typeof articleGenerationPlanSchema>;
export type ArticleSectionDraft = z.infer<typeof articleSectionDraftSchema>;
export type ArticleGuidanceInput = z.input<typeof articleGuidanceInputSchema>;
export type ArticlePlanValidationInput = z.input<typeof articlePlanValidationInputSchema>;
export type ArticleSectionValidationInput = z.input<typeof articleSectionValidationInputSchema>;
export type ArticleAssemblyInput = z.input<typeof articleAssemblyInputSchema>;

export const availableArticleTypes = articleTypeSchema.options;
export const availableRetentionTargets = retentionTargetSchema.options;
