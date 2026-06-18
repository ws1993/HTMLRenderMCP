import { guideArticleHtmlGeneration } from "../article/articleGuidance.js";
import { textContent } from "../server/toolResponse.js";
import { articleHtmlGuidanceInputSchema } from "../toolSchemas/articleHtmlGenerationInputSchemas.js";
import type { HtmlRenderTool } from "./types.js";

export const guideArticleHtmlGenerationTool: HtmlRenderTool = {
  name: "guide_article_html_generation",
  description:
    "Upstream article harness guidance tool. It returns a deterministic article plan skeleton for section-by-section drafting before render_information_structure_html. It does not fetch sources, write prose, persist files, or render final HTML.",
  inputSchema: articleHtmlGuidanceInputSchema,
  async handle(args: unknown) {
    return textContent(guideArticleHtmlGeneration(args));
  }
};
