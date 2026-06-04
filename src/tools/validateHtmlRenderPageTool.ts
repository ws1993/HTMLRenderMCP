 import { validateHtmlRenderPage } from "../preflight/htmlRenderPreflight.js";
 import { textContent } from "../server/toolResponse.js";
 import { htmlRenderValidationInputSchema } from "../toolSchemas/htmlRenderValidationInputSchema.js";
 import type { HtmlRenderTool } from "./types.js";

 export const validateHtmlRenderPageTool: HtmlRenderTool = {
   name: "validate_html_render_page",
   description:
     "Preflight validation tool for HTML Render MCP. Use after drafting a page object and before the final one-shot render tool. It checks schema errors, common generation mistakes such as stringified comparison cells, semantic structure/profile/strategy drift, Markdown-heavy rich text, and optional dry-run renderability. It returns JSON readiness diagnostics and never returns final HTML.",
   inputSchema: htmlRenderValidationInputSchema,
   async handle(args: unknown) {
     return textContent(await validateHtmlRenderPage(args));
   }
 };
