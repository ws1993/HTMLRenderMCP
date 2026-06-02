import { z } from "zod";
import { normalizeRenderFinalHtmlArguments } from "../adapters/normalizeToolArguments.js";
import { renderInlineHtmlFragment } from "../renderers/renderInlineHtml.js";
import { htmlPageSchema } from "../schemas/htmlPageSchema.js";
import { textContent } from "../server/toolResponse.js";
import { finalHtmlInputSchema } from "../toolSchemas/finalHtmlInputSchema.js";
import type { HtmlRenderTool } from "./types.js";

const renderFinalHtmlSchema = z.preprocess(
  normalizeRenderFinalHtmlArguments,
  z.object({
    page: htmlPageSchema
  })
);

export const renderFinalHtmlTool: HtmlRenderTool = {
  name: "render_final_html",
  description:
    "Core one-shot HTML renderer for Cherry Studio. Use this only after all searching, reasoning, and content drafting are complete. It accepts the complete page under the page field and returns one continuous HTML fragment intended to be placed in the final assistant message.",
  inputSchema: finalHtmlInputSchema,
  async handle(args: unknown) {
    const { page } = renderFinalHtmlSchema.parse(args);
    const html = await renderInlineHtmlFragment(page);

    return textContent(html);
  }
};
