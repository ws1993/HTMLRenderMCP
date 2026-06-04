 import assert from "node:assert/strict";
 import test from "node:test";
 import { getToolByName, listToolDefinitions } from "../server/toolRegistry.js";
 import { guideHtmlRenderPageTool } from "../tools/guideHtmlRenderPageTool.js";
 import { validateHtmlRenderPageTool } from "../tools/validateHtmlRenderPageTool.js";

 function parseToolJson(response: { content: Array<{ text: string }> }): Record<string, any> {
   return JSON.parse(response.content[0]?.text ?? "{}");
 }

 test("guide_html_render_page recommends an information-structure tutorial skeleton", async () => {
   const response = await guideHtmlRenderPageTool.handle({
     title: "Hermes Agent guide",
     structure: "tutorial"
   });
   const result = parseToolJson(response);

   assert.equal(response.isError, undefined);
   assert.equal(result.targetTool, "render_information_structure_html");
   assert.equal(result.recommended.structure, "tutorial");
   assert.deepEqual(result.recommended.contentTypes, ["tutorial"]);
   assert.equal(result.recommended.styleProfile, "auto");
   assert.equal(result.recommended.expressionStrategy, "workshop");
   assert.ok(result.recommended.expressionTypes.includes("process-guide"));
   assert.equal(result.pageSkeleton.page.structure, "tutorial");
   assert.match(JSON.stringify(result.generationRules), /validate_html_render_page/);
 });

 test("validate_html_render_page reports string comparison-table cells before final rendering", async () => {
   const response = await validateHtmlRenderPageTool.handle({
     targetTool: "render_information_structure_html",
     page: JSON.stringify({
       title: "Install guide",
       structure: "tutorial",
       expression: {
         coreViewpoint: "Install first, validate second."
       },
       blocks: [
         {
           type: "comparison-table",
           title: "Install options",
           columns: ["pip", "curl"],
           rows: [
             {
               label: "Extra dependencies",
               cells: '["manual postinstall", "auto installs dependencies"]'
             }
           ]
         }
       ]
     })
   });
   const result = parseToolJson(response);

   assert.equal(response.isError, undefined);
   assert.equal(result.readyToRender, false);
   assert.ok(
     result.errors.some(
       (error: { path: string; message: string; fix: string }) =>
         error.path === "page.blocks[0].rows[0].cells" &&
         /array/i.test(error.message) &&
         /array of strings/i.test(error.fix)
     )
   );
   assert.equal(result.nextAction, "revise_page");
 });

 test("validate_html_render_page warns about markdown-heavy rich text", async () => {
   const response = await validateHtmlRenderPageTool.handle({
     targetTool: "render_information_structure_html",
     page: {
       title: "Hermes Agent guide",
       structure: "tutorial",
       expression: {
         coreViewpoint: "Configure, launch, then validate."
       },
       expressions: [
         {
           type: "process-guide",
           title: "Setup path",
           goal: "Complete the first working run.",
           steps: [
             {
               title: "Configure provider",
               body: "Run **setup** first.\n\n```bash\nhermes setup --portal\n```",
               checkpoint: "Provider is selected."
             }
           ]
         }
       ]
     }
   });
   const result = parseToolJson(response);

   assert.equal(result.readyToRender, true);
   assert.ok(result.warnings.some((warning: { code: string }) => warning.code === "markdown_code_fence"));
   assert.ok(result.warnings.some((warning: { code: string }) => warning.code === "markdown_bold_marker"));
 });

 test("validate_html_render_page returns ready dry-run summary without final html", async () => {
   const response = await validateHtmlRenderPageTool.handle({
     targetTool: "render_information_structure_html",
     page: {
       title: "A/B decision brief",
       structure: "compare",
       expression: {
         coreViewpoint: "Choose A for speed and B for long-term scale."
       },
       expressions: [
         {
           type: "decision-matrix",
           title: "Options",
           criteria: ["Speed", "Maintenance"],
           options: [
             { name: "A", verdict: "recommended", scores: ["high", "medium"], rationale: "Fastest path." },
             { name: "B", verdict: "acceptable", scores: ["medium", "high"], rationale: "Better long term." }
           ]
         }
       ]
     }
   });
   const result = parseToolJson(response);

   assert.equal(result.readyToRender, true);
   assert.equal(result.nextAction, "call_render_information_structure_html_once");
   assert.equal(result.normalizedArguments.page.structure, "compare");
   assert.equal(result.dryRun.renderable, true);
   assert.equal(result.dryRun.containsHtmlDocumentTag, false);
   assert.equal(result.dryRun.containsScript, false);
   assert.equal("html" in result.dryRun, false);
 });

 test("preflight tools are registered", () => {
   const definitions = listToolDefinitions();

   assert.ok(definitions.some((tool) => tool.name === "guide_html_render_page"));
   assert.ok(definitions.some((tool) => tool.name === "validate_html_render_page"));
   assert.equal(getToolByName("guide_html_render_page"), guideHtmlRenderPageTool);
   assert.equal(getToolByName("validate_html_render_page"), validateHtmlRenderPageTool);
 });
