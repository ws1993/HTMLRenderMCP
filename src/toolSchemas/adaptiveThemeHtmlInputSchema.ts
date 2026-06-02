import {
  availableAdaptiveExpressionStrategies,
  availableAdaptiveExpressionTypes,
  availableAdaptiveStyleProfiles
} from "../schemas/adaptiveThemeHtmlPageSchema.js";
import { availableUpgradedBlockTypes, availableUpgradedContentTypes } from "../schemas/upgradedHtmlPageSchema.js";
import { footerInputSchema } from "./sharedInputSchema.js";
import { upgradedBlockInputSchema, upgradedDesignTokensInputSchema } from "./upgradedHtmlInputSchema.js";

const adaptiveStringListInputSchema = {
  type: "array",
  minItems: 1,
  items: { type: "string" }
} as const;

const adaptiveTitledBodyExpressionItemInputSchema = {
  type: "object",
  required: ["title"],
  properties: {
    title: { type: "string" },
    body: { type: "string" }
  }
} as const;

const adaptiveFactExpressionItemInputSchema = {
  type: "object",
  required: ["label", "value"],
  properties: {
    label: { type: "string" },
    value: { type: "string" },
    detail: { type: "string" }
  }
} as const;

export const adaptiveExpressionConfigInputSchema = {
  type: "object",
  properties: {
    strategy: {
      type: "string",
      enum: availableAdaptiveExpressionStrategies,
      default: "auto",
      description:
        "Information structure strategy. Use auto unless you need to force top-down, inverted-pyramid, decision, academic, workshop, argument, or catalog expression."
    },
    emphasis: {
      type: "string",
      enum: ["core-viewpoint", "recommendation", "evidence", "comparison", "process", "sources"],
      description: "Optional emphasis that can steer auto strategy selection."
    },
    density: { type: "string", enum: ["narrative", "balanced", "compact"], default: "balanced" },
    hierarchy: { type: "string", enum: ["strong", "normal", "flat"], default: "normal" },
    coreViewpoint: {
      type: "string",
      description: "Central conclusion, thesis, news lead, learning goal, or recommendation to show first."
    },
    keyTakeaways: adaptiveStringListInputSchema
  },
  description:
    "Global expression guidance. When expressions are omitted, coreViewpoint and keyTakeaways can generate lead/executive-summary and takeaway sections automatically."
} as const;

export const adaptiveExpressionInputSchema = {
  anyOf: [
    {
      type: "object",
      required: ["type", "body"],
      properties: {
        type: { const: "lead" },
        eyebrow: { type: "string" },
        title: { type: "string" },
        body: { type: "string" },
        facts: { type: "array", items: adaptiveFactExpressionItemInputSchema }
      }
    },
    {
      type: "object",
      required: ["type", "items"],
      properties: {
        type: { const: "key-takeaways" },
        title: { type: "string" },
        intro: { type: "string" },
        items: { type: "array", minItems: 1, items: adaptiveTitledBodyExpressionItemInputSchema }
      }
    },
    {
      type: "object",
      required: ["type", "recommendation"],
      properties: {
        type: { const: "executive-summary" },
        title: { type: "string" },
        ask: { type: "string" },
        recommendation: { type: "string" },
        decisionHeadlines: adaptiveStringListInputSchema,
        rationale: { type: "string" },
        impact: { type: "string" }
      }
    },
    {
      type: "object",
      required: ["type", "claim", "evidence"],
      properties: {
        type: { const: "evidence-map" },
        title: { type: "string" },
        claim: { type: "string" },
        evidence: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["title"],
            properties: {
              title: { type: "string" },
              body: { type: "string" },
              confidence: { type: "string", enum: ["low", "medium", "high"] }
            }
          }
        },
        limitations: adaptiveStringListInputSchema
      }
    },
    {
      type: "object",
      required: ["type", "title", "criteria", "options"],
      properties: {
        type: { const: "decision-matrix" },
        title: { type: "string" },
        intro: { type: "string" },
        recommendation: { type: "string" },
        criteria: { type: "array", minItems: 1, items: { type: "string" } },
        options: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              verdict: { type: "string", enum: ["recommended", "acceptable", "risky", "reject"] },
              scores: { type: "array", items: { type: "string" } },
              rationale: { type: "string" }
            }
          }
        }
      }
    },
    {
      type: "object",
      required: ["type", "claim", "reasons"],
      properties: {
        type: { const: "argument-map" },
        title: { type: "string" },
        claim: { type: "string" },
        reasons: { type: "array", minItems: 1, items: adaptiveTitledBodyExpressionItemInputSchema },
        counterarguments: { type: "array", items: adaptiveTitledBodyExpressionItemInputSchema },
        conclusion: { type: "string" }
      }
    },
    {
      type: "object",
      required: ["type", "title", "goal", "steps"],
      properties: {
        type: { const: "process-guide" },
        title: { type: "string" },
        goal: { type: "string" },
        prerequisites: adaptiveStringListInputSchema,
        steps: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["title"],
            properties: {
              title: { type: "string" },
              body: { type: "string" },
              checkpoint: { type: "string" },
              output: { type: "string" }
            }
          }
        },
        checks: adaptiveStringListInputSchema
      }
    },
    {
      type: "object",
      required: ["type", "title", "items"],
      properties: {
        type: { const: "ranked-list" },
        title: { type: "string" },
        intro: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["title"],
            properties: {
              title: { type: "string" },
              body: { type: "string" },
              rank: { anyOf: [{ type: "string" }, { type: "number" }] },
              tags: adaptiveStringListInputSchema,
              fit: { type: "string" }
            }
          }
        }
      }
    },
    {
      type: "object",
      required: ["type", "title", "sections"],
      properties: {
        type: { const: "section-outline" },
        title: { type: "string" },
        intro: { type: "string" },
        sections: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["title"],
            properties: {
              title: { type: "string" },
              body: { type: "string" },
              children: { type: "array", items: adaptiveTitledBodyExpressionItemInputSchema }
            }
          }
        }
      }
    }
  ],
  description: `Semantic adaptive expression selected from: ${availableAdaptiveExpressionTypes.join(", ")}.`
} as const;

const adaptiveThemePageInputSchema = {
  type: "object",
  required: ["title"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    lang: { type: "string", default: "zh-CN" },
    contentTypes: {
      type: "array",
      minItems: 1,
      items: { type: "string", enum: availableUpgradedContentTypes },
      default: ["news"]
    },
    styleProfile: {
      type: "string",
      enum: availableAdaptiveStyleProfiles,
      default: "auto",
      description:
        "Visual style profile. Use auto to map contentTypes automatically: news->old-newspaper, research->academic-journal, explain->clean-magazine, compare->decision-brief, tutorial->workshop-guide, list->curated-list, opinion->editorial-column."
    },
    tokens: upgradedDesignTokensInputSchema,
    expression: adaptiveExpressionConfigInputSchema,
    expressions: {
      type: "array",
      default: [],
      items: adaptiveExpressionInputSchema,
      description:
        "High-level semantic expressions rendered with profile-specific structures, such as news leads, decision briefs, evidence maps, process guides, and ranked catalogs."
    },
    blocks: {
      type: "array",
      default: [],
      items: upgradedBlockInputSchema,
      description: `Optional upgraded layout blocks selected from: ${availableUpgradedBlockTypes.join(
        ", "
      )}. They remain supported for compatibility and are rendered with adaptive profile overrides when available.`
    },
    footer: footerInputSchema
  }
} as const;

export const adaptiveThemeHtmlInputSchema = {
  type: "object",
  required: ["page"],
  properties: {
    page: {
      ...adaptiveThemePageInputSchema,
      description:
        "Complete adaptive-theme page object. Pass this as an object, not a JSON string; JSON-string compatibility is only a fallback."
    }
  }
} as const;
