import { z } from "zod";
import { normalizeRenderAdaptiveThemeHtmlArguments } from "../adapters/normalizeToolArguments.js";
import { renderAdaptiveThemeInlineHtmlFragment } from "../renderers/renderAdaptiveThemeInlineHtml.js";
import { adaptiveThemeHtmlPageSchema } from "../schemas/adaptiveThemeHtmlPageSchema.js";
import { textContent } from "../server/toolResponse.js";
import { adaptiveThemeHtmlInputSchema } from "../toolSchemas/adaptiveThemeHtmlInputSchema.js";
import type { HtmlRenderTool } from "./types.js";

const renderAdaptiveThemeHtmlSchema = z.preprocess(
  normalizeRenderAdaptiveThemeHtmlArguments,
  z.object({
    page: adaptiveThemeHtmlPageSchema
  })
);

export const renderAdaptiveThemeHtmlTool: HtmlRenderTool = {
  name: "render_adaptive_theme_html",
  description:
    "Adaptive one-shot HTML renderer for Cherry Studio with theme-aware semantic expression strategies. Use this after all searching, reasoning, and content drafting are complete when the page should choose a more effective information form automatically: news can use an inverted-pyramid lead, compare can use a recommendation-first decision brief, research can use evidence/academic structure, tutorial can use a workshop path, opinion can use an argument column, and list can use a ranked catalog. Prefer expression/expressions for high-level meaning; upgraded blocks remain supported for compatibility with adaptive profile overrides. It returns one continuous inline-styled HTML fragment.",
  inputSchema: adaptiveThemeHtmlInputSchema,
  async handle(args: unknown) {
    const { page } = renderAdaptiveThemeHtmlSchema.parse(args);
    const html = await renderAdaptiveThemeInlineHtmlFragment(page);

    return textContent(html);
  }
};
