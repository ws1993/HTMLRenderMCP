import { availableThemes } from "../schemas/htmlPageSchema.js";
import { availableUpgradedBlockTypes, availableUpgradedContentTypes } from "../schemas/upgradedHtmlPageSchema.js";
import { footerInputSchema } from "./sharedInputSchema.js";

export const upgradedDesignTokensInputSchema = {
  type: "object",
  properties: {
    primaryColor: { type: "string", description: "Optional safe hex color, for example #2563eb." },
    accentColor: { type: "string", description: "Optional safe hex color, for example #f59e0b." },
    fontScale: { type: "string", enum: ["compact", "normal", "large"], default: "normal" },
    cardRadius: { type: "string", enum: ["none", "small", "medium", "large", "pill"], default: "medium" },
    spacingScale: { type: "string", enum: ["compact", "normal", "relaxed"], default: "normal" },
    density: { type: "string", enum: ["compact", "normal", "comfortable"], default: "normal" },
    borderStyle: { type: "string", enum: ["none", "solid", "soft", "accent"], default: "solid" },
    shadowLevel: { type: "string", enum: ["none", "soft", "medium", "strong"], default: "soft" }
  }
} as const;

const upgradedMetricItemInputSchema = {
  type: "object",
  required: ["label", "value"],
  properties: {
    label: { type: "string" },
    value: { type: "string" },
    detail: { type: "string" }
  }
} as const;

const upgradedTitledBodyItemInputSchema = {
  type: "object",
  required: ["title", "body"],
  properties: {
    title: { type: "string" },
    body: { type: "string" }
  }
} as const;

const upgradedCtaInputSchema = {
  type: "object",
  required: ["label"],
  properties: {
    label: { type: "string" },
    href: { type: "string", default: "#" }
  }
} as const;

export const upgradedBlockInputSchema = {
  anyOf: [
    {
      type: "object",
      required: ["type", "title"],
      properties: {
        type: { const: "hero" },
        eyebrow: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        meta: { type: "array", items: { type: "string" } },
        highlights: { type: "array", items: upgradedMetricItemInputSchema },
        cta: upgradedCtaInputSchema
      }
    },
    {
      type: "object",
      required: ["type", "title", "body"],
      properties: {
        type: { const: "summary-card" },
        title: { type: "string" },
        body: { type: "string" },
        items: { type: "array", items: upgradedTitledBodyItemInputSchema }
      }
    },
    {
      type: "object",
      required: ["type", "title", "items"],
      properties: {
        type: { const: "timeline" },
        title: { type: "string" },
        intro: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["title", "body"],
            properties: {
              time: { type: "string" },
              title: { type: "string" },
              body: { type: "string" }
            }
          }
        }
      }
    },
    {
      type: "object",
      required: ["type", "items"],
      properties: {
        type: { const: "stat-grid" },
        title: { type: "string" },
        intro: { type: "string" },
        items: { type: "array", minItems: 1, items: upgradedMetricItemInputSchema }
      }
    },
    {
      type: "object",
      required: ["type", "title", "columns", "rows"],
      properties: {
        type: { const: "comparison-table" },
        title: { type: "string" },
        intro: { type: "string" },
        columns: { type: "array", minItems: 2, items: { type: "string" } },
        rows: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["cells"],
            properties: {
              label: { type: "string" },
              cells: { type: "array", minItems: 1, items: { type: "string" } }
            }
          }
        }
      }
    },
    {
      type: "object",
      required: ["type", "text"],
      properties: {
        type: { const: "quote" },
        text: { type: "string" },
        source: { type: "string" }
      }
    },
    {
      type: "object",
      required: ["type", "title", "items"],
      properties: {
        type: { const: "risk-box" },
        title: { type: "string" },
        intro: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["title", "body"],
            properties: {
              title: { type: "string" },
              body: { type: "string" },
              severity: { type: "string", enum: ["low", "medium", "high"], default: "medium" }
            }
          }
        }
      }
    },
    {
      type: "object",
      required: ["type", "title", "items"],
      properties: {
        type: { const: "faq" },
        title: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["question", "answer"],
            properties: {
              question: { type: "string" },
              answer: { type: "string" }
            }
          }
        }
      }
    },
    {
      type: "object",
      required: ["type", "title", "items"],
      properties: {
        type: { const: "steps" },
        title: { type: "string" },
        intro: { type: "string" },
        items: { type: "array", minItems: 1, items: upgradedTitledBodyItemInputSchema }
      }
    },
    {
      type: "object",
      required: ["type", "title", "items"],
      properties: {
        type: { const: "source-list" },
        title: { type: "string" },
        intro: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["label"],
            properties: {
              label: { type: "string" },
              href: { type: "string", default: "#" },
              description: { type: "string" }
            }
          }
        }
      }
    },
    {
      type: "object",
      required: ["type", "body"],
      properties: {
        type: { const: "callout" },
        title: { type: "string" },
        body: { type: "string" },
        tone: { type: "string", enum: ["neutral", "info", "success", "warning", "danger"], default: "info" }
      }
    }
  ]
} as const;

const upgradedPageInputSchema = {
  type: "object",
  required: ["title", "blocks"],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    lang: { type: "string", default: "zh-CN" },
    theme: { type: "string", enum: availableThemes, default: "modern-blue" },
    contentTypes: {
      type: "array",
      minItems: 1,
      items: { type: "string", enum: availableUpgradedContentTypes },
      default: ["research"]
    },
    tokens: upgradedDesignTokensInputSchema,
    blocks: {
      type: "array",
      minItems: 1,
      items: upgradedBlockInputSchema,
      description: `Layout blocks selected from: ${availableUpgradedBlockTypes.join(", ")}.`
    },
    footer: footerInputSchema
  }
} as const;

export const upgradedHtmlInputSchema = {
  type: "object",
  required: ["page"],
  properties: {
    page: {
      ...upgradedPageInputSchema,
      description:
        "Complete upgraded page object. Pass this as an object, not a JSON string; JSON-string compatibility is only a fallback."
    }
  }
} as const;
