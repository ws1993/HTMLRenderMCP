import { validateArticleSectionDraft } from "../article/articleSectionValidation.js";
import { textContent } from "../server/toolResponse.js";
import { articleSectionDraftValidationInputSchema } from "../toolSchemas/articleHtmlGenerationInputSchemas.js";
import type { HtmlRenderTool } from "./types.js";

export const validateArticleSectionDraftTool: HtmlRenderTool = {
  name: "validate_article_section_draft",
  description:
    "Validates one drafted article section against the approved article plan and existing expression/block schemas. It does not fetch sources, write prose, persist files, or render final HTML.",
  inputSchema: articleSectionDraftValidationInputSchema,
  async handle(args: unknown) {
    return textContent(validateArticleSectionDraft(args));
  }
};
