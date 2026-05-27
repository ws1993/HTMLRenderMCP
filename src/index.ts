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
  footerSchema,
  htmlPageSchema,
  sectionSchema,
  templateSchema,
  themeSchema
} from "./schemas/htmlPageSchema.js";
import { renderHtmlPage } from "./renderers/renderHtml.js";
import {
  renderInlineHtmlFragment,
  renderInlineSectionFragment
} from "./renderers/renderInlineHtml.js";
import { safeWriteFile } from "./utils/safeWriteFile.js";
import {
  appendLiveSection,
  clearLiveSession,
  listLiveSessions,
  removeLiveSection,
  replaceLiveSection,
  requireLiveSession,
  startLiveSession,
  updateLiveSessionMeta,
  type LiveSession
} from "./live/liveStore.js";
import {
  ensurePreviewServer,
  getBaseUrl,
  getEventUrl,
  getPreviewUrl,
  notifyLiveSession
} from "./live/previewServer.js";

const renderHtmlFileSchema = htmlPageSchema.extend({
  outputPath: z.string().min(1, "outputPath is required")
});

function parseJsonString(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const htmlPageArgumentSchema = z.preprocess(parseJsonString, htmlPageSchema);
const sectionArgumentSchema = z.preprocess(parseJsonString, sectionSchema);

const renderFinalHtmlSchema = z.object({
  page: htmlPageArgumentSchema
});

const renderInlineSectionSchema = z.object({
  section: sectionArgumentSchema,
  theme: themeSchema.default("modern-blue")
});

const liveStartSchema = z.object({
  sessionId: z.string().default("default"),
  template: templateSchema.default("landing-page"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  lang: z.string().default("zh-CN"),
  theme: themeSchema.default("modern-blue"),
  sections: z.array(sectionSchema).default([]),
  footer: footerSchema
});

const liveSessionSchema = z.object({
  sessionId: z.string().default("default")
});

const liveUpdateMetaSchema = liveSessionSchema.extend({
  template: templateSchema.optional(),
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  lang: z.string().optional(),
  theme: themeSchema.optional(),
  footer: footerSchema
});

const liveAppendSectionSchema = liveSessionSchema.extend({
  section: sectionArgumentSchema
});

const liveReplaceSectionSchema = liveAppendSectionSchema.extend({
  index: z.number().int().nonnegative()
});

const liveRemoveSectionSchema = liveSessionSchema.extend({
  index: z.number().int().nonnegative()
});

const liveExportSchema = liveSessionSchema.extend({
  outputPath: z.string().min(1, "outputPath is required")
});

const enableInlineSectionTool = process.env.HTML_RENDER_MCP_ENABLE_INLINE_SECTION === "1";

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

const sectionOrJsonStringInputSchema = {
  anyOf: [
    ...sectionInputSchema.anyOf,
    {
      type: "string",
      description:
        "JSON string containing one section object. Prefer passing an object when the client supports it."
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

const pageOrJsonStringInputSchema = {
  anyOf: [
    pageInputSchema,
    {
      type: "string",
      description:
        "JSON string containing the complete page object. Prefer passing an object when the client supports it."
    }
  ]
} as const;

const finalHtmlInputSchema = {
  type: "object",
  required: ["page"],
  properties: {
    page: pageOrJsonStringInputSchema
  }
} as const;

const inlineSectionInputSchema = {
  type: "object",
  required: ["section"],
  properties: {
    theme: pageInputSchema.properties.theme,
    section: sectionOrJsonStringInputSchema
  }
} as const;

const liveStartInputSchema = {
  type: "object",
  required: ["title"],
  properties: {
    sessionId: {
      type: "string",
      default: "default",
      description: "Live render session id. Use letters, numbers, '_' or '-'."
    },
    template: pageInputSchema.properties.template,
    title: { type: "string" },
    description: { type: "string" },
    lang: pageInputSchema.properties.lang,
    theme: pageInputSchema.properties.theme,
    sections: {
      type: "array",
      items: sectionInputSchema,
      default: []
    },
    footer: footerInputSchema
  }
} as const;

const liveSessionInputSchema = {
  type: "object",
  properties: {
    sessionId: {
      type: "string",
      default: "default"
    }
  }
} as const;

const liveUpdateInputSchema = {
  type: "object",
  properties: {
    ...liveSessionInputSchema.properties,
    template: pageInputSchema.properties.template,
    title: { type: "string" },
    description: { type: "string" },
    lang: pageInputSchema.properties.lang,
    theme: pageInputSchema.properties.theme,
    footer: footerInputSchema
  }
} as const;

const liveSectionInputSchema = {
  type: "object",
  required: ["section"],
  properties: {
    ...liveSessionInputSchema.properties,
    section: sectionOrJsonStringInputSchema
  }
} as const;

const liveReplaceInputSchema = {
  type: "object",
  required: ["index", "section"],
  properties: {
    ...liveSessionInputSchema.properties,
    index: { type: "integer", minimum: 0 },
    section: sectionOrJsonStringInputSchema
  }
} as const;

const liveRemoveInputSchema = {
  type: "object",
  required: ["index"],
  properties: {
    ...liveSessionInputSchema.properties,
    index: { type: "integer", minimum: 0 }
  }
} as const;

const liveExportInputSchema = {
  type: "object",
  required: ["outputPath"],
  properties: {
    ...liveSessionInputSchema.properties,
    outputPath: {
      type: "string",
      description: "Relative output path, for example output/live.html."
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

function liveSessionResponse(session: LiveSession): Record<string, unknown> {
  return {
    ok: true,
    sessionId: session.sessionId,
    title: session.page.title,
    template: session.page.template,
    theme: session.page.theme,
    sections: session.page.sections.length,
    version: session.version,
    updatedAt: session.updatedAt,
    previewUrl: getPreviewUrl(session.sessionId),
    snapshotUrl: `${getBaseUrl()}/snapshot/${encodeURIComponent(session.sessionId)}`,
    eventUrl: getEventUrl(session.sessionId)
  };
}

async function ensurePreviewAndRespond(session: LiveSession): Promise<ReturnType<typeof textContent>> {
  const previewServer = await ensurePreviewServer();

  return textContent({
    ...liveSessionResponse(session),
    previewServer
  });
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "render_final_html",
      description:
        "Final one-shot renderer for Cherry Studio. Use this only after all searching, reasoning, and content drafting are complete. It accepts the complete page under the page field and returns one continuous HTML fragment intended to be placed in the final assistant message.",
      inputSchema: finalHtmlInputSchema
    },
    {
      name: "render_inline_html",
      description:
        "Render structured page data into a single HTML fragment for Cherry Studio chat messages. Use when the full page content is ready and should appear as one continuous rendered block.",
      inputSchema: pageInputSchema
    },
    ...(enableInlineSectionTool
      ? [
          {
            name: "render_inline_section",
            description:
              "Render one structured section into an HTML fragment for incremental Cherry Studio chat rendering. Disabled by default; enable only for explicit section-by-section workflows.",
            inputSchema: inlineSectionInputSchema
          }
        ]
      : []),
    {
      name: "render_html",
      description: "Render structured page data into a formatted HTML string.",
      inputSchema: pageInputSchema
    },
    {
      name: "render_html_file",
      description:
        "Render structured page data into HTML and write it to an .html file inside the current working directory.",
      inputSchema: {
        ...pageInputSchema,
        required: ["title", "sections", "outputPath"],
        properties: {
          ...pageInputSchema.properties,
          outputPath: {
            type: "string",
            description: "Relative output path, for example output/index.html."
          }
        }
      }
    },
    {
      name: "start_live_render",
      description:
        "Start or replace a live HTML render session and return a local preview URL that refreshes when the session changes.",
      inputSchema: liveStartInputSchema
    },
    {
      name: "update_live_render",
      description: "Update live render session metadata such as title, description, theme, template, language or footer.",
      inputSchema: liveUpdateInputSchema
    },
    {
      name: "append_live_section",
      description: "Append one structured section to a live render session and refresh the preview page.",
      inputSchema: liveSectionInputSchema
    },
    {
      name: "replace_live_section",
      description: "Replace a section in a live render session by zero-based index and refresh the preview page.",
      inputSchema: liveReplaceInputSchema
    },
    {
      name: "remove_live_section",
      description: "Remove a section from a live render session by zero-based index and refresh the preview page.",
      inputSchema: liveRemoveInputSchema
    },
    {
      name: "clear_live_render",
      description: "Remove all sections from a live render session while keeping page metadata.",
      inputSchema: liveSessionInputSchema
    },
    {
      name: "get_live_render",
      description: "Get live render session metadata and current structured page data.",
      inputSchema: liveSessionInputSchema
    },
    {
      name: "list_live_renders",
      description: "List all live render sessions currently stored in memory.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "export_live_render",
      description: "Export the current live render session to a static .html or .htm file.",
      inputSchema: liveExportInputSchema
    },
    {
      name: "list_html_templates",
      description: "List supported HTML templates, visual themes, section types and live render tools.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "validate_html_input",
      description: "Validate structured page data without rendering HTML.",
      inputSchema: pageInputSchema
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments ?? {};

  try {
    switch (request.params.name) {
      case "render_inline_html": {
        const input = htmlPageSchema.parse(args);
        const html = await renderInlineHtmlFragment(input);

        return textContent(html);
      }

      case "render_final_html": {
        const { page } = renderFinalHtmlSchema.parse(args);
        const html = await renderInlineHtmlFragment(page);

        return textContent(html);
      }

      case "render_inline_section": {
        if (!enableInlineSectionTool) {
          throw new Error(
            "render_inline_section is disabled because this server is configured for final one-shot rendering. Finish all content first, then call render_final_html once with the complete page."
          );
        }

        const { section, theme } = renderInlineSectionSchema.parse(args);
        const html = await renderInlineSectionFragment(section, theme);

        return textContent(html);
      }

      case "render_html": {
        const input = htmlPageSchema.parse(args);
        const html = await renderHtmlPage(input);

        return textContent(html);
      }

      case "render_html_file": {
        const { outputPath, ...input } = renderHtmlFileSchema.parse(args);
        const html = await renderHtmlPage(input);
        const result = await safeWriteFile(outputPath, html);

        return textContent({
          ok: true,
          outputPath: result.relativePath,
          absolutePath: result.absolutePath
        });
      }

      case "start_live_render": {
        const { sessionId, ...page } = liveStartSchema.parse(args);
        const session = startLiveSession(sessionId, page);

        notifyLiveSession(session.sessionId);

        return ensurePreviewAndRespond(session);
      }

      case "update_live_render": {
        const { sessionId, ...patch } = liveUpdateMetaSchema.parse(args);
        const session = updateLiveSessionMeta(sessionId, patch);

        notifyLiveSession(session.sessionId);

        return ensurePreviewAndRespond(session);
      }

      case "append_live_section": {
        const { sessionId, section } = liveAppendSectionSchema.parse(args);
        const session = appendLiveSection(sessionId, section);

        notifyLiveSession(session.sessionId);

        return ensurePreviewAndRespond(session);
      }

      case "replace_live_section": {
        const { sessionId, index, section } = liveReplaceSectionSchema.parse(args);
        const session = replaceLiveSection(sessionId, index, section);

        notifyLiveSession(session.sessionId);

        return ensurePreviewAndRespond(session);
      }

      case "remove_live_section": {
        const { sessionId, index } = liveRemoveSectionSchema.parse(args);
        const session = removeLiveSection(sessionId, index);

        notifyLiveSession(session.sessionId);

        return ensurePreviewAndRespond(session);
      }

      case "clear_live_render": {
        const { sessionId } = liveSessionSchema.parse(args);
        const session = clearLiveSession(sessionId);

        notifyLiveSession(session.sessionId);

        return ensurePreviewAndRespond(session);
      }

      case "get_live_render": {
        const { sessionId } = liveSessionSchema.parse(args);
        const session = requireLiveSession(sessionId);
        await ensurePreviewServer();

        return textContent({
          ...liveSessionResponse(session),
          page: session.page
        });
      }

      case "list_live_renders": {
        await ensurePreviewServer();

        return textContent({
          ok: true,
          baseUrl: getBaseUrl(),
          sessions: listLiveSessions().map(liveSessionResponse)
        });
      }

      case "export_live_render": {
        const { sessionId, outputPath } = liveExportSchema.parse(args);
        const session = requireLiveSession(sessionId);
        const html = await renderHtmlPage(session.page);
        const result = await safeWriteFile(outputPath, html);

        return textContent({
          ok: true,
          sessionId: session.sessionId,
          outputPath: result.relativePath,
          absolutePath: result.absolutePath
        });
      }

      case "list_html_templates":
        return textContent({
          templates: availableTemplates,
          themes: availableThemes,
          sections: ["hero", "features", "content", "steps", "faq"],
          inlineTools: enableInlineSectionTool
            ? ["render_final_html", "render_inline_html", "render_inline_section"]
            : ["render_final_html", "render_inline_html"],
          recommendedInlineTool: "render_final_html",
          inlineRenderingGuidance:
            "For concentrated Cherry Studio rendering, finish all searching and drafting first, then call render_final_html once with the complete page. render_inline_section is not exposed unless HTML_RENDER_MCP_ENABLE_INLINE_SECTION=1 is set.",
          liveTools: [
            "start_live_render",
            "update_live_render",
            "append_live_section",
            "replace_live_section",
            "remove_live_section",
            "clear_live_render",
            "get_live_render",
            "list_live_renders",
            "export_live_render"
          ]
        });

      case "validate_html_input": {
        const input = htmlPageSchema.parse(args);

        return textContent({ ok: true, input });
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
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
