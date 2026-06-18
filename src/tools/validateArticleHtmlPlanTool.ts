import { validateArticleHtmlPlan } from "../article/articlePlanValidation.js";
import { textContent } from "../server/toolResponse.js";
import { articleHtmlPlanValidationInputSchema } from "../toolSchemas/articleHtmlGenerationInputSchemas.js";
import type { HtmlRenderTool } from "./types.js";

export const validateArticleHtmlPlanTool: HtmlRenderTool = {
  name: "validate_article_html_plan",
  description:
    "Validates an article harness plan before section drafting. It checks plan completeness, section coverage, and article structure readiness. It does not fetch sources, write prose, persist files, or render final HTML.",
  inputSchema: articleHtmlPlanValidationInputSchema,
  async handle(args: unknown) {
    return textContent(validateArticleHtmlPlan(args));
  }
};
