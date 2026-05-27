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

const renderFinalHtmlSchema = z.preprocess(
  normalizeRenderFinalHtmlArguments,
  z.object({
    page: htmlPageSchema
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

      default:
        throw new Error(
          `Tool ${request.params.name} is disabled. This MCP server only exposes render_final_html for one-shot Cherry Studio HTML output.`
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
