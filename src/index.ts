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
import { renderInlineHtmlFragment } from "./renderers/renderInlineHtml.js";
import { renderUpgradedInlineHtmlFragment } from "./renderers/renderUpgradedInlineHtml.js";
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

      default:
        throw new Error(
          `Tool ${request.params.name} is disabled. This MCP server exposes render_final_html and render_upgraded_html for one-shot Cherry Studio HTML output.`
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
