import {
  availableAdaptiveExpressionStrategies,
  availableAdaptiveExpressionTypes,
  availableAdaptiveStyleProfiles
} from "../schemas/adaptiveThemeHtmlPageSchema.js";
import {
  availableInformationStructures,
  informationStructureDescriptions
} from "../schemas/informationStructureHtmlPageSchema.js";
import { availableUpgradedBlockTypes, availableUpgradedContentTypes } from "../schemas/upgradedHtmlPageSchema.js";
import { adaptiveExpressionConfigInputSchema, adaptiveExpressionInputSchema } from "./adaptiveThemeHtmlInputSchema.js";
import { footerInputSchema } from "./sharedInputSchema.js";
import { upgradedBlockInputSchema, upgradedDesignTokensInputSchema } from "./upgradedHtmlInputSchema.js";

const structureStyleGuide = [
  "news -> old-newspaper + inverted-pyramid",
  "research -> academic-journal + academic/IMRaD",
  "explain -> clean-magazine + hook/analogy/principle",
  "compare -> decision-brief + criteria matrix",
  "tutorial -> workshop-guide + outcome-first steps",
  "list -> curated-list + ranked catalog",
  "opinion -> editorial-column + thesis/counterargument"
].join("; ");

const informationStructurePageInputSchema = {
  type: "object",
  required: ["title"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    lang: { type: "string", default: "zh-CN" },
    structure: {
      type: "string",
      enum: availableInformationStructures,
      default: "auto",
      description: `Information structure from 信息结构调整.md. Available structures: ${availableInformationStructures.join(
        ", "
      )}. ${structureStyleGuide}`
    },
    contentTypes: {
      type: "array",
      minItems: 1,
      items: { type: "string", enum: availableUpgradedContentTypes },
      description:
        "Optional compatibility hint. If structure is auto, contentTypes are used to infer the information structure and adaptive visual profile."
    },
    styleProfile: {
      type: "string",
      enum: availableAdaptiveStyleProfiles,
      default: "auto",
      description:
        "Visual style profile. Use auto to map structure/contentTypes to old-newspaper, academic-journal, clean-magazine, decision-brief, workshop-guide, curated-list, or editorial-column."
    },
    tokens: upgradedDesignTokensInputSchema,
    expression: {
      ...adaptiveExpressionConfigInputSchema,
      description: `Global expression guidance. Strategy can be ${availableAdaptiveExpressionStrategies.join(
        ", "
      )}; when omitted or auto, the selected information structure supplies the strategy.`
    },
    expressions: {
      type: "array",
      default: [],
      items: adaptiveExpressionInputSchema,
      description: `Semantic modules rendered according to the selected information structure. Supported expression types: ${availableAdaptiveExpressionTypes.join(
        ", "
      )}. Structure notes: ${Object.entries(informationStructureDescriptions)
        .map(([key, value]) => `${key}: ${value}`)
        .join(" ")}`
    },
    blocks: {
      type: "array",
      default: [],
      items: upgradedBlockInputSchema,
      description: `Optional upgraded layout blocks selected from: ${availableUpgradedBlockTypes.join(
        ", "
      )}. Prefer expressions for structure-critical content; blocks remain a compatibility layer.`
    },
    footer: footerInputSchema
  }
} as const;

export const informationStructureHtmlInputSchema = {
  type: "object",
  required: ["page"],
  properties: {
    page: {
      ...informationStructurePageInputSchema,
      description:
        "Complete information-structure page object. Pass this as an object, not a JSON string; top-level page fields are accepted as a compatibility fallback."
    }
  }
} as const;
