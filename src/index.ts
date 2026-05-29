#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  availableTemplates,
  availableThemes,
  htmlPageSchema
} from "./schemas/htmlPageSchema.js";
import { renderAdaptiveThemeInlineHtmlFragment } from "./renderers/renderAdaptiveThemeInlineHtml.js";
import { renderInlineHtmlFragment } from "./renderers/renderInlineHtml.js";
import { renderUpgradedInlineHtmlFragment } from "./renderers/renderUpgradedInlineHtml.js";
import {
  adaptiveThemeHtmlPageSchema,
  availableAdaptiveExpressionStrategies,
  availableAdaptiveExpressionTypes,
  availableAdaptiveStyleProfiles
} from "./schemas/adaptiveThemeHtmlPageSchema.js";
import {
  availableUpgradedBlockTypes,
  availableUpgradedContentTypes,
  upgradedHtmlPageSchema
} from "./schemas/upgradedHtmlPageSchema.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stripJsonCodeFence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:json|javascript|js)?\s*([\s\S]*?)\s*```$/i);

  return match?.[1].trim() ?? trimmed;
}

function jsonErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function nextSignificantCharacter(source: string, start: number): string | undefined {
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (!/\s/.test(character)) {
      return character;
    }
  }

  return undefined;
}

function repairLikelyUnescapedStringQuotes(source: string): string {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (!inString) {
      if (character === '"') {
        inString = true;
      }

      output += character;
      continue;
    }

    if (escaped) {
      output += character;
      escaped = false;
      continue;
    }

    if (character === "\\") {
      output += character;
      escaped = true;
      continue;
    }

    if (character === '"') {
      const next = nextSignificantCharacter(source, index + 1);
      const isJsonStringTerminator = next === undefined || next === ":" || next === "," || next === "}" || next === "]";

      if (!isJsonStringTerminator) {
        output += '\\"';
        continue;
      }

      inString = false;
    }

    output += character;
  }

  return output;
}

function parseJsonString(value: unknown, fieldName: string): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const source = stripJsonCodeFence(value);

  try {
    return JSON.parse(source);
  } catch (error) {
    const repaired = repairLikelyUnescapedStringQuotes(source);

    if (repaired !== source) {
      try {
        return JSON.parse(repaired);
      } catch {
        // Fall through to the actionable error below.
      }
    }

    throw new Error(
      `${fieldName} must be an object or a valid JSON string. Failed to parse JSON: ${jsonErrorMessage(
        error
      )}. Prefer passing ${fieldName} as a native object instead of a string. If text contains straight double quotes inside a JSON string, escape them as \\" (example: NCAA\\"疯狂三月\\"第一轮) or use Chinese quotation marks.`
    );
  }
}

function normalizeRenderFinalHtmlArguments(value: unknown): unknown {
  const args = parseJsonString(value, "arguments");

  if (!isRecord(args)) {
    return args;
  }

  const unwrappedArgs = isRecord(args.params) && !("page" in args) ? args.params : args;

  if ("page" in unwrappedArgs) {
    return {
      ...unwrappedArgs,
      page: parseJsonString(unwrappedArgs.page, "page")
    };
  }

  if ("title" in unwrappedArgs && "sections" in unwrappedArgs) {
    return {
      page: unwrappedArgs
    };
  }

  return unwrappedArgs;
}

function normalizeRenderUpgradedHtmlArguments(value: unknown): unknown {
  const args = parseJsonString(value, "arguments");

  if (!isRecord(args)) {
    return args;
  }

  const unwrappedArgs = isRecord(args.params) && !("page" in args) ? args.params : args;

  if ("page" in unwrappedArgs) {
    return {
      ...unwrappedArgs,
      page: parseJsonString(unwrappedArgs.page, "page")
    };
  }

  if ("title" in unwrappedArgs && "blocks" in unwrappedArgs) {
    return {
      page: unwrappedArgs
    };
  }

  return unwrappedArgs;
}

function normalizeRenderAdaptiveThemeHtmlArguments(value: unknown): unknown {
  const args = parseJsonString(value, "arguments");

  if (!isRecord(args)) {
    return args;
  }

  const unwrappedArgs = isRecord(args.params) && !("page" in args) ? args.params : args;

  if ("page" in unwrappedArgs) {
    return {
      ...unwrappedArgs,
      page: parseJsonString(unwrappedArgs.page, "page")
    };
  }

  if ("title" in unwrappedArgs && ("blocks" in unwrappedArgs || "expressions" in unwrappedArgs || "expression" in unwrappedArgs)) {
    return {
      page: unwrappedArgs
    };
  }

  return unwrappedArgs;
}

const renderFinalHtmlSchema = z.preprocess(
  normalizeRenderFinalHtmlArguments,
  z.object({
    page: htmlPageSchema
  })
);

const renderUpgradedHtmlSchema = z.preprocess(
  normalizeRenderUpgradedHtmlArguments,
  z.object({
    page: upgradedHtmlPageSchema
  })
);

const renderAdaptiveThemeHtmlSchema = z.preprocess(
  normalizeRenderAdaptiveThemeHtmlArguments,
  z.object({
    page: adaptiveThemeHtmlPageSchema
  })
);

const sectionInputSchema = {
  anyOf: [
    {
      type: "object",
      required: ["type", "heading"],
      properties: {
        type: { const: "hero" },
        heading: { type: "string" },
        subheading: { type: "string" },
        cta: {
          type: "object",
          properties: {
            label: { type: "string" },
            href: { type: "string", default: "#" }
          },
          required: ["label"]
        }
      }
    },
    {
      type: "object",
      required: ["type", "heading", "items"],
      properties: {
        type: { const: "features" },
        heading: { type: "string" },
        intro: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["title", "body"],
            properties: {
              title: { type: "string" },
              body: { type: "string" }
            }
          }
        }
      }
    },
    {
      type: "object",
      required: ["type", "heading", "body"],
      properties: {
        type: { const: "content" },
        heading: { type: "string" },
        body: { type: "string" }
      }
    },
    {
      type: "object",
      required: ["type", "heading", "items"],
      properties: {
        type: { const: "steps" },
        heading: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["title", "body"],
            properties: {
              title: { type: "string" },
              body: { type: "string" }
            }
          }
        }
      }
    },
    {
      type: "object",
      required: ["type", "heading", "items"],
      properties: {
        type: { const: "faq" },
        heading: { type: "string" },
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
    }
  ]
} as const;

const footerInputSchema = {
  type: "object",
  properties: {
    text: { type: "string" },
    links: {
      type: "array",
      items: {
        type: "object",
        required: ["label"],
        properties: {
          label: { type: "string" },
          href: { type: "string", default: "#" }
        }
      }
    }
  }
} as const;

const pageInputSchema = {
  type: "object",
  required: ["title", "sections"],
  properties: {
    template: {
      type: "string",
      enum: availableTemplates,
      default: "landing-page"
    },
    title: { type: "string" },
    description: { type: "string" },
    lang: { type: "string", default: "zh-CN" },
    theme: {
      type: "string",
      enum: availableThemes,
      default: "modern-blue"
    },
    sections: {
      type: "array",
      minItems: 1,
      items: sectionInputSchema
    },
    footer: footerInputSchema
  }
} as const;

const finalHtmlInputSchema = {
  type: "object",
  required: ["page"],
  properties: {
    page: {
      ...pageInputSchema,
      description:
        "Complete page object. Pass this as an object, not a JSON string; the server keeps JSON-string compatibility only as a legacy fallback."
    }
  }
} as const;

const upgradedDesignTokensInputSchema = {
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

const upgradedBlockInputSchema = {
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

const upgradedHtmlInputSchema = {
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

const adaptiveExpressionConfigInputSchema = {
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

const adaptiveExpressionInputSchema = {
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

const adaptiveThemeHtmlInputSchema = {
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

const server = new Server(
  {
    name: "html-render-mcp",
    version: "0.3.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

function formatError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return JSON.stringify(z.treeifyError(error), null, 2);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function textContent(value: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
    ]
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "render_final_html",
      description:
        "Core one-shot HTML renderer for Cherry Studio. Use this only after all searching, reasoning, and content drafting are complete. It accepts the complete page under the page field and returns one continuous HTML fragment intended to be placed in the final assistant message.",
      inputSchema: finalHtmlInputSchema
    },
    {
      name: "render_upgraded_html",
      description:
        "Independent upgraded one-shot HTML renderer for Cherry Studio. Use this after all searching, reasoning, and content drafting are complete when you want the rule-system/design-token/content-type workflow from the upgraded technical plan. It accepts a complete upgraded page under the page field and returns one continuous inline-styled HTML fragment. This tool does not change render_final_html.",
      inputSchema: upgradedHtmlInputSchema
    },
    {
      name: "render_adaptive_theme_html",
      description:
        "Adaptive one-shot HTML renderer for Cherry Studio with theme-aware semantic expression strategies. Use this after all searching, reasoning, and content drafting are complete when the page should choose a more effective information form automatically: news can use an inverted-pyramid lead, compare can use a recommendation-first decision brief, research can use evidence/academic structure, tutorial can use a workshop path, opinion can use an argument column, and list can use a ranked catalog. Prefer expression/expressions for high-level meaning; upgraded blocks remain supported for compatibility with adaptive profile overrides. It returns one continuous inline-styled HTML fragment.",
      inputSchema: adaptiveThemeHtmlInputSchema
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments ?? {};

  try {
    switch (request.params.name) {
      case "render_final_html": {
        const { page } = renderFinalHtmlSchema.parse(args);
        const html = await renderInlineHtmlFragment(page);

        return textContent(html);
      }

      case "render_upgraded_html": {
        const { page } = renderUpgradedHtmlSchema.parse(args);
        const html = await renderUpgradedInlineHtmlFragment(page);

        return textContent(html);
      }

      case "render_adaptive_theme_html": {
        const { page } = renderAdaptiveThemeHtmlSchema.parse(args);
        const html = await renderAdaptiveThemeInlineHtmlFragment(page);

        return textContent(html);
      }

      default:
        throw new Error(
          `Tool ${request.params.name} is disabled. This MCP server exposes render_final_html, render_upgraded_html, and render_adaptive_theme_html for one-shot Cherry Studio HTML output.`
        );
    }
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: formatError(error) }]
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
