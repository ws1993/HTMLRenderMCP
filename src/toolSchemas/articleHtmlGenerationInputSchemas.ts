import { availableAdaptiveStyleProfiles } from "../schemas/adaptiveThemeHtmlPageSchema.js";
import {
  availableArticleTypes,
  availableRetentionTargets
} from "../schemas/articleHtmlGenerationSchema.js";
import { availableInformationStructures } from "../schemas/informationStructureHtmlPageSchema.js";
import { adaptiveExpressionInputSchema } from "./adaptiveThemeHtmlInputSchema.js";
import { upgradedBlockInputSchema } from "./upgradedHtmlInputSchema.js";

const resolvedInformationStructures = availableInformationStructures.filter((structure) => structure !== "auto");

const stringListInputSchema = {
  type: "array",
  items: { type: "string" }
} as const;

const articleBriefInputSchema = {
  type: "object",
  required: ["purpose", "coreViewpoint", "readerOutcome"],
  properties: {
    purpose: { type: "string" },
    coreViewpoint: { type: "string" },
    readerOutcome: { type: "string" }
  }
} as const;

const articleSectionPlanInputSchema = {
  type: "object",
  required: ["id", "title", "purpose"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    purpose: { type: "string" },
    sourceCoverage: stringListInputSchema,
    expressionPlan: stringListInputSchema,
    visualPlan: { type: "string" },
    acceptanceChecks: stringListInputSchema
  }
} as const;

const articlePlanInputSchema = {
  type: "object",
  required: ["title", "brief"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    articleType: {
      type: "string",
      enum: availableArticleTypes,
      default: "longform"
    },
    retentionTarget: {
      type: "string",
      enum: availableRetentionTargets,
      default: "80-100%"
    },
    audience: { type: "string" },
    targetStructure: {
      type: "string",
      enum: resolvedInformationStructures,
      default: "explain"
    },
    styleProfile: {
      type: "string",
      enum: availableAdaptiveStyleProfiles,
      default: "auto"
    },
    brief: articleBriefInputSchema,
    sections: {
      type: "array",
      default: [],
      items: articleSectionPlanInputSchema
    },
    reviewChecklist: stringListInputSchema
  }
} as const;

const articleSectionDraftInputSchema = {
  type: "object",
  required: ["sectionId", "title", "summary"],
  properties: {
    sectionId: { type: "string" },
    title: { type: "string" },
    summary: { type: "string" },
    sourceCoverage: stringListInputSchema,
    expressions: {
      type: "array",
      default: [],
      items: adaptiveExpressionInputSchema
    },
    blocks: {
      type: "array",
      default: [],
      items: upgradedBlockInputSchema
    },
    reviewNotes: stringListInputSchema
  }
} as const;

export const articleHtmlGuidanceInputSchema = {
  type: "object",
  required: ["title"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    sourceSummary: {
      type: "string",
      description: "Optional source summary already prepared by the calling agent. This tool does not fetch or summarize sources."
    },
    audience: { type: "string" },
    articleType: {
      type: "string",
      enum: availableArticleTypes,
      description: "Article production mode. The calling agent still writes the prose."
    },
    retentionTarget: {
      type: "string",
      enum: availableRetentionTargets,
      description: "How much source information the article should preserve."
    },
    targetStructure: {
      type: "string",
      enum: resolvedInformationStructures,
      description: "Optional information structure override for the eventual render_information_structure_html page."
    },
    styleProfile: {
      type: "string",
      enum: availableAdaptiveStyleProfiles,
      default: "auto"
    }
  }
} as const;

export const articleHtmlPlanValidationInputSchema = {
  type: "object",
  required: ["plan"],
  properties: {
    plan: articlePlanInputSchema
  }
} as const;

export const articleSectionDraftValidationInputSchema = {
  type: "object",
  required: ["plan", "draft"],
  properties: {
    plan: articlePlanInputSchema,
    draft: articleSectionDraftInputSchema
  }
} as const;

export const articleHtmlAssemblyInputSchema = {
  type: "object",
  required: ["plan", "sections"],
  properties: {
    plan: articlePlanInputSchema,
    sections: {
      type: "array",
      items: articleSectionDraftInputSchema
    }
  }
} as const;
