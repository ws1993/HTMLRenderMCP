import { z } from "zod";
import { normalizeRenderInformationStructureHtmlArguments } from "../adapters/normalizeToolArguments.js";
import { renderInformationStructureInlineHtmlFragment } from "../renderers/renderInformationStructureInlineHtml.js";
import { informationStructureHtmlPageSchema } from "../schemas/informationStructureHtmlPageSchema.js";
import { textContent } from "../server/toolResponse.js";
import { informationStructureHtmlInputSchema } from "../toolSchemas/informationStructureHtmlInputSchema.js";
import type { HtmlRenderTool } from "./types.js";

const renderInformationStructureHtmlSchema = z.preprocess(
  normalizeRenderInformationStructureHtmlArguments,
  z.object({
    page: informationStructureHtmlPageSchema
  })
);

export const renderInformationStructureHtmlTool: HtmlRenderTool = {
  name: "render_information_structure_html",
  description:
    "Information structure one-shot HTML renderer for Cherry Studio. This is an upgraded adaptive renderer based on 信息结构调整.md: news uses an inverted-pyramid newspaper style, research uses IMRaD/academic evidence structure, explain uses a clean magazine explainer, compare uses a decision brief and criteria matrix, tutorial uses an outcome-first workshop guide, list uses a curated ranked catalog, and opinion uses an editorial thesis/counterargument column. Use it after all searching, reasoning, and drafting are complete; prefer semantic expressions and let structure/styleProfile auto select the best visual strategy. It returns one continuous inline-styled HTML fragment.",
  inputSchema: informationStructureHtmlInputSchema,
  async handle(args: unknown) {
    const { page } = renderInformationStructureHtmlSchema.parse(args);
    const html = await renderInformationStructureInlineHtmlFragment(page);

    return textContent(html);
  }
};
