 import { guideHtmlRenderPage } from "../preflight/htmlRenderPreflight.js";
 import { textContent } from "../server/toolResponse.js";
 import { htmlRenderGuidanceInputSchema } from "../toolSchemas/htmlRenderGuidanceInputSchema.js";
 import type { HtmlRenderTool } from "./types.js";

 export const guideHtmlRenderPageTool: HtmlRenderTool = {
   name: "guide_html_render_page",
   description:
     "Preflight guidance tool for HTML Render MCP. Use before drafting page JSON for render_adaptive_theme_html or render_information_structure_html. It recommends target structure, contentTypes, style profile, expression strategy, semantic expression order, generation rules, and a page skeleton. It does not render final HTML.",
   inputSchema: htmlRenderGuidanceInputSchema,
   async handle(args: unknown) {
     return textContent(guideHtmlRenderPage(args));
   }
 };
