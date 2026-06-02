import { z } from "zod";
import { normalizeRenderUpgradedHtmlArguments } from "../adapters/normalizeToolArguments.js";
import { renderUpgradedInlineHtmlFragment } from "../renderers/renderUpgradedInlineHtml.js";
import { upgradedHtmlPageSchema } from "../schemas/upgradedHtmlPageSchema.js";
import { textContent } from "../server/toolResponse.js";
import { upgradedHtmlInputSchema } from "../toolSchemas/upgradedHtmlInputSchema.js";
import type { HtmlRenderTool } from "./types.js";

const renderUpgradedHtmlSchema = z.preprocess(
  normalizeRenderUpgradedHtmlArguments,
  z.object({
    page: upgradedHtmlPageSchema
  })
);

export const renderUpgradedHtmlTool: HtmlRenderTool = {
  name: "render_upgraded_html",
  description:
    "Independent upgraded one-shot HTML renderer for Cherry Studio. Use this after all searching, reasoning, and content drafting are complete when you want the rule-system/design-token/content-type workflow from the upgraded technical plan. It accepts a complete upgraded page under the page field and returns one continuous inline-styled HTML fragment. This tool does not change render_final_html.",
  inputSchema: upgradedHtmlInputSchema,
  async handle(args: unknown) {
    const { page } = renderUpgradedHtmlSchema.parse(args);
    const html = await renderUpgradedInlineHtmlFragment(page);

    return textContent(html);
  }
};
