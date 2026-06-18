import { assembleArticleHtmlPage } from "../article/articleAssembly.js";
import { textContent } from "../server/toolResponse.js";
import { articleHtmlAssemblyInputSchema } from "../toolSchemas/articleHtmlGenerationInputSchemas.js";
import type { HtmlRenderTool } from "./types.js";

export const assembleArticleHtmlPageTool: HtmlRenderTool = {
  name: "assemble_article_html_page",
  description:
    "Assembles an approved article plan and section drafts into a render_information_structure_html page object. It returns JSON only and never renders final HTML; call validate_html_render_page next.",
  inputSchema: articleHtmlAssemblyInputSchema,
  async handle(args: unknown) {
    return textContent(assembleArticleHtmlPage(args));
  }
};
