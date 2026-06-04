 import { z } from "zod";
 import { parseJsonString } from "../adapters/parseJsonString.js";
 import { renderAdaptiveThemeInlineHtmlFragment } from "../renderers/renderAdaptiveThemeInlineHtml.js";
 import { renderInformationStructureInlineHtmlFragment } from "../renderers/renderInformationStructureInlineHtml.js";
 import {
   adaptiveThemeHtmlPageSchema,
   type AdaptiveExpressionInput,
   type AdaptiveExpressionStrategy,
   type AdaptiveStyleProfile,
   type AdaptiveThemeHtmlPageInput
 } from "../schemas/adaptiveThemeHtmlPageSchema.js";
 import {
   informationStructureHtmlPageSchema,
   type InformationStructure,
   type InformationStructureHtmlPageOutput,
   type ResolvedInformationStructure
 } from "../schemas/informationStructureHtmlPageSchema.js";
 import type { UpgradedContentType } from "../schemas/upgradedHtmlPageSchema.js";

 export type PreflightTargetTool = "render_adaptive_theme_html" | "render_information_structure_html";

 export interface PreflightDiagnostic {
   path: string;
   code: string;
   message: string;
   fix: string;
 }

 interface StructureGuide {
   contentType: UpgradedContentType;
   styleProfile: Exclude<AdaptiveStyleProfile, "auto">;
   strategy: Exclude<AdaptiveExpressionStrategy, "auto">;
   expressionTypes: string[];
   generationHint: string;
 }

 const targetTools = ["render_adaptive_theme_html", "render_information_structure_html"] as const;
 const defaultTargetTool: PreflightTargetTool = "render_information_structure_html";
 const structurePriority: ResolvedInformationStructure[] = ["news", "opinion", "tutorial", "compare", "research", "explain", "list"];

 const structureGuides: Record<ResolvedInformationStructure, StructureGuide> = {
   news: {
     contentType: "news",
     styleProfile: "old-newspaper",
     strategy: "inverted-pyramid",
     expressionTypes: ["lead", "key-takeaways", "section-outline"],
     generationHint: "Put the most important fact first, then context, impact, and follow-up."
   },
   research: {
     contentType: "research",
     styleProfile: "academic-journal",
     strategy: "academic",
     expressionTypes: ["lead", "evidence-map", "section-outline", "source-list"],
     generationHint: "Separate claim, evidence, limitations, and source material."
   },
   explain: {
     contentType: "explain",
     styleProfile: "clean-magazine",
     strategy: "top-down",
     expressionTypes: ["lead", "key-takeaways", "section-outline"],
     generationHint: "Start with the hook and plain-language principle before deeper details."
   },
   compare: {
     contentType: "compare",
     styleProfile: "decision-brief",
     strategy: "decision",
     expressionTypes: ["executive-summary", "decision-matrix", "key-takeaways"],
     generationHint: "Define criteria before comparing options and give a scenario-based recommendation."
   },
   tutorial: {
     contentType: "tutorial",
     styleProfile: "workshop-guide",
     strategy: "workshop",
     expressionTypes: ["lead", "process-guide", "key-takeaways", "section-outline"],
     generationHint: "Make the target outcome, prerequisites, steps, checkpoints, and acceptance checks explicit."
   },
   list: {
     contentType: "list",
     styleProfile: "curated-list",
     strategy: "catalog",
     expressionTypes: ["lead", "ranked-list", "key-takeaways"],
     generationHint: "State the selection criteria and give each item rank, fit, tags, and trade-offs."
   },
   opinion: {
     contentType: "opinion",
     styleProfile: "editorial-column",
     strategy: "argument",
     expressionTypes: ["lead", "argument-map", "key-takeaways"],
     generationHint: "State the thesis, reasons, counterarguments, synthesis, and closing stance."
   }
 };

 const contentTypeToStructure: Record<UpgradedContentType, ResolvedInformationStructure> = {
   news: "news",
   research: "research",
   explain: "explain",
   compare: "compare",
   tutorial: "tutorial",
   list: "list",
   opinion: "opinion"
 };

 function isRecord(value: unknown): value is Record<string, unknown> {
   return typeof value === "object" && value !== null && !Array.isArray(value);
 }

 function normalizeArguments(value: unknown): Record<string, unknown> {
   const args = parseJsonString(value, "arguments");

   if (!isRecord(args)) {
     return {};
   }

   return isRecord(args.params) && !("page" in args) ? args.params : args;
 }

 function normalizeTargetTool(value: unknown, page?: unknown): PreflightTargetTool {
   if (typeof value === "string" && targetTools.includes(value as PreflightTargetTool)) {
     return value as PreflightTargetTool;
   }

   if (isRecord(page) && "structure" in page) {
     return "render_information_structure_html";
   }

   return defaultTargetTool;
 }

 function normalizeStructure(value: unknown, contentTypes: UpgradedContentType[] = []): ResolvedInformationStructure {
   if (typeof value === "string" && value in structureGuides) {
     return value as ResolvedInformationStructure;
   }

   for (const structure of structurePriority) {
     if (contentTypes.includes(structureGuides[structure].contentType)) {
       return structure;
     }
   }

   return "news";
 }

 function normalizeContentTypes(value: unknown): UpgradedContentType[] {
   if (!Array.isArray(value)) {
     return [];
   }

   return value.filter((item): item is UpgradedContentType => typeof item === "string" && item in contentTypeToStructure);
 }

function pathToString(path: PropertyKey[]): string {
  return `page${path
    .map((part) => (typeof part === "number" ? `[${part}]` : `.${String(part)}`))
    .join("")}`;
}

 function diagnostic(path: string, code: string, message: string, fix: string): PreflightDiagnostic {
   return { path, code, message, fix };
 }

 function formatUnknownError(error: unknown): string {
   return error instanceof Error ? error.message : String(error);
 }

 function createExpressionSkeleton(structure: ResolvedInformationStructure): AdaptiveExpressionInput[] {
   switch (structure) {
     case "news":
       return [
         {
           type: "lead",
           eyebrow: "News lead",
           title: "Replace with the main event",
           body: "Replace with the most important fact, impact, and latest status.",
           facts: [{ label: "When", value: "Replace with time", detail: "Replace with context" }]
         },
         {
           type: "key-takeaways",
           title: "What matters first",
           items: [{ title: "Replace with key fact", body: "Replace with why it matters." }]
         }
       ];

     case "research":
       return [
         {
           type: "evidence-map",
           title: "Evidence map",
           claim: "Replace with the main research claim.",
           evidence: [{ title: "Replace with evidence", body: "Replace with evidence detail.", confidence: "medium" }],
           limitations: ["Replace with a known limitation."]
         }
       ];

     case "explain":
       return [
         {
           type: "section-outline",
           title: "Explanation path",
           sections: [
             {
               title: "Replace with the core concept",
               body: "Replace with a plain-language explanation.",
               children: [{ title: "Replace with supporting idea", body: "Replace with detail." }]
             }
           ]
         }
       ];

     case "compare":
       return [
         {
           type: "decision-matrix",
           title: "Decision matrix",
           intro: "Replace with comparison scope.",
           recommendation: "Replace with the recommended option and scenario.",
           criteria: ["Replace with criterion A", "Replace with criterion B"],
           options: [
             { name: "Option A", verdict: "recommended", scores: ["high", "medium"], rationale: "Replace with rationale." },
             { name: "Option B", verdict: "acceptable", scores: ["medium", "high"], rationale: "Replace with rationale." }
           ]
         }
       ];

     case "tutorial":
       return [
         {
           type: "process-guide",
           title: "Step-by-step path",
           goal: "Replace with the outcome the reader should achieve.",
           prerequisites: ["Replace with prerequisite."],
           steps: [
             {
               title: "Step 1",
               body: "Replace with one action and its context.",
               checkpoint: "Replace with observable checkpoint.",
               output: "Replace with expected output."
             }
           ],
           checks: ["Replace with acceptance check."]
         }
       ];

     case "list":
       return [
         {
           type: "ranked-list",
           title: "Curated list",
           intro: "Replace with selection criteria.",
           items: [
             {
               rank: 1,
               title: "Replace with item name",
               body: "Replace with item review.",
               tags: ["Replace with tag"],
               fit: "Replace with best-fit scenario."
             }
           ]
         }
       ];

     case "opinion":
       return [
         {
           type: "argument-map",
           title: "Argument map",
           claim: "Replace with the central thesis.",
           reasons: [{ title: "Replace with reason", body: "Replace with supporting argument." }],
           counterarguments: [{ title: "Replace with counterargument", body: "Replace with response." }],
           conclusion: "Replace with final stance."
         }
       ];
   }
 }

 export function guideHtmlRenderPage(value: unknown): Record<string, unknown> {
   const args = normalizeArguments(value);
   const contentTypes = normalizeContentTypes(args.contentTypes);
   const structure = normalizeStructure(args.structure, contentTypes);
   const guide = structureGuides[structure];
   const targetTool = normalizeTargetTool(args.targetTool);
   const title = typeof args.title === "string" && args.title.trim() ? args.title : "Replace with final page title";
   const description = typeof args.description === "string" && args.description.trim() ? args.description : "Replace with final page summary";
   const basePage = {
     title,
     description,
     styleProfile: "auto",
     contentTypes: contentTypes.length ? contentTypes : [guide.contentType],
     expression: {
       strategy: "auto",
       coreViewpoint: "Replace with the central conclusion, thesis, news lead, or reader outcome.",
       keyTakeaways: ["Replace with the first reader-facing takeaway.", "Replace with the second reader-facing takeaway."]
     },
     expressions: createExpressionSkeleton(structure),
     footer: {
       text: "Generated by HTML Render MCP preflight workflow"
     }
   };

   const pageSkeleton =
     targetTool === "render_information_structure_html"
       ? { page: { ...basePage, structure } }
       : { page: basePage };

   return {
     targetTool,
     recommended: {
       structure: targetTool === "render_information_structure_html" ? structure : undefined,
       contentTypes: contentTypes.length ? contentTypes : [guide.contentType],
       styleProfile: "auto",
       resolvedStyleProfile: guide.styleProfile,
       expressionStrategy: guide.strategy,
       expressionTypes: guide.expressionTypes,
       generationHint: guide.generationHint
     },
     pageSkeleton,
     generationRules: [
       "Use guide_html_render_page before drafting the page object.",
       "Call validate_html_render_page before the final render tool.",
       "Only call the final render tool once after readyToRender is true.",
       "Prefer semantic expressions over blocks for structure-critical content.",
       "Do not put Markdown tables or fenced code blocks into rich text body fields.",
       "comparison-table rows[].cells must be an array of strings, not a string that looks like an array."
     ],
     nextAction: "draft_page_then_call_validate_html_render_page"
   };
 }

 function zodFixForIssue(issue: z.core.$ZodIssue): string {
   const path = issue.path.join(".");

   if (path.includes("cells")) {
     return "Use an array of strings for cells, for example [\"A\", \"B\"].";
   }

   if (path.includes("expressions")) {
     return "Use one of the supported semantic expression objects and include all required fields for that type.";
   }

   if (path.includes("blocks")) {
     return "Use one of the supported layout block objects and include all required fields for that block type.";
   }

   return "Revise this field to match the tool input schema before final rendering.";
 }

 function zodDiagnostics(error: z.ZodError): PreflightDiagnostic[] {
   return error.issues.map((issue) =>
     diagnostic(pathToString(issue.path), String(issue.code), issue.message, zodFixForIssue(issue))
   );
 }

 function collectComparisonCellDiagnostics(page: unknown): { errors: PreflightDiagnostic[]; warnings: PreflightDiagnostic[] } {
   const errors: PreflightDiagnostic[] = [];
   const warnings: PreflightDiagnostic[] = [];

   if (!isRecord(page) || !Array.isArray(page.blocks)) {
     return { errors, warnings };
   }

   page.blocks.forEach((block, blockIndex) => {
     if (!isRecord(block) || block.type !== "comparison-table" || !Array.isArray(block.rows)) {
       return;
     }

     const columnsLength = Array.isArray(block.columns) ? block.columns.length : undefined;

     block.rows.forEach((row, rowIndex) => {
       if (!isRecord(row)) {
         return;
       }

       const path = `page.blocks[${blockIndex}].rows[${rowIndex}].cells`;

       if (typeof row.cells === "string") {
         errors.push(
           diagnostic(
             path,
             "comparison_cells_string",
             "comparison-table rows[].cells must be an array, but this row is a string.",
             "Replace the string with an array of strings, for example [\"manual postinstall\", \"auto installs dependencies\"]."
           )
         );
         return;
       }

       if (columnsLength !== undefined && Array.isArray(row.cells) && row.cells.length !== columnsLength) {
         warnings.push(
           diagnostic(
             path,
             "comparison_cells_count_mismatch",
             `This row has ${row.cells.length} cells but the table has ${columnsLength} columns.`,
             "Make each row cells array match the columns array length."
           )
         );
       }
     });
   });

   return { errors, warnings };
 }

 function collectDecisionMatrixWarnings(page: unknown): PreflightDiagnostic[] {
   const warnings: PreflightDiagnostic[] = [];

   if (!isRecord(page) || !Array.isArray(page.expressions)) {
     return warnings;
   }

   page.expressions.forEach((expression, expressionIndex) => {
    if (!isRecord(expression) || expression.type !== "decision-matrix" || !Array.isArray(expression.criteria) || !Array.isArray(expression.options)) {
      return;
    }

    const criteria = expression.criteria;
    const options = expression.options;

    options.forEach((option, optionIndex) => {
      if (!isRecord(option) || !Array.isArray(option.scores) || option.scores.length === criteria.length) {
        return;
      }

      warnings.push(
        diagnostic(
          `page.expressions[${expressionIndex}].options[${optionIndex}].scores`,
          "decision_scores_count_mismatch",
          `This option has ${option.scores.length} scores but the matrix has ${criteria.length} criteria.`,
          "Make each option scores array match the criteria array length."
        )
      );
     });
   });

   return warnings;
 }

 function collectMarkdownWarnings(value: unknown, path: Array<string | number> = []): PreflightDiagnostic[] {
   const warnings: PreflightDiagnostic[] = [];

   if (typeof value === "string") {
     const stringPath = pathToString(path);

     if (/```/.test(value)) {
       warnings.push(
         diagnostic(
           stringPath,
           "markdown_code_fence",
           "Fenced Markdown code blocks are escaped as plain text in inline rich text fields.",
           "Move commands into concise prose, steps, checks, or separate callout text instead of fenced code blocks."
         )
       );
     }

     if (/^\s*\|.+\|\s*$/m.test(value)) {
       warnings.push(
         diagnostic(
           stringPath,
           "markdown_table",
           "Markdown tables are not converted into HTML tables by the renderer.",
           "Use a decision-matrix expression or comparison-table block with structured rows and cells."
         )
       );
     }

     if (/^\s{0,3}#{1,6}\s+\S/m.test(value)) {
       warnings.push(
         diagnostic(
           stringPath,
           "markdown_heading",
           "Markdown headings inside rich text fields are rendered as escaped text, not section headings.",
           "Split this content into structured expressions, sections, or blocks with title fields."
         )
       );
     }

     if (/^\s*(?:[-*+] |\d+\.\s+)\S/m.test(value)) {
       warnings.push(
         diagnostic(
           stringPath,
           "markdown_list",
           "Markdown lists inside rich text fields are not converted into list components.",
           "Use key-takeaways items, process steps, ranked-list items, or block items instead."
         )
       );
     }

     if (/\*\*[^*]+\*\*/.test(value)) {
       warnings.push(
         diagnostic(
           stringPath,
           "markdown_bold_marker",
           "Markdown bold markers are not converted into bold text by the renderer.",
           "Use plain emphasis in wording or allowed inline tags such as <strong> when needed."
         )
       );
     }

     if (value.length > 1400) {
       warnings.push(
         diagnostic(
           stringPath,
           "long_rich_text_field",
           "This rich text field is very long and may flatten the page hierarchy.",
           "Split the content into multiple semantic expressions, steps, items, or outline sections."
         )
       );
     }

     return warnings;
   }

   if (Array.isArray(value)) {
     value.forEach((item, index) => warnings.push(...collectMarkdownWarnings(item, [...path, index])));
     return warnings;
   }

   if (isRecord(value)) {
     Object.entries(value).forEach(([key, nested]) => warnings.push(...collectMarkdownWarnings(nested, [...path, key])));
   }

   return warnings;
 }

 function collectSemanticWarnings(targetTool: PreflightTargetTool, page: AdaptiveThemeHtmlPageInput | InformationStructureHtmlPageOutput): PreflightDiagnostic[] {
   const warnings: PreflightDiagnostic[] = [];
   const contentTypes = "contentTypes" in page && Array.isArray(page.contentTypes) ? page.contentTypes : [];
   const structure =
     targetTool === "render_information_structure_html" && "structure" in page
       ? normalizeStructure(page.structure, contentTypes)
       : normalizeStructure(undefined, contentTypes);
   const guide = structureGuides[structure];

   if (targetTool === "render_information_structure_html" && "contentTypes" in page && page.contentTypes?.length) {
     const expectedContentType = structureGuides[structure].contentType;

     if (!page.contentTypes.includes(expectedContentType)) {
       warnings.push(
         diagnostic(
           "page.contentTypes",
           "structure_content_type_mismatch",
           `Structure ${structure} usually maps to contentTypes containing ${expectedContentType}.`,
           "Use matching structure/contentTypes or remove contentTypes and let the renderer infer them."
         )
       );
     }
   }

   if (page.styleProfile !== "auto" && page.styleProfile !== guide.styleProfile) {
     warnings.push(
       diagnostic(
         "page.styleProfile",
         "style_profile_mismatch",
         `${structure} usually maps to ${guide.styleProfile}, but styleProfile is ${page.styleProfile}.`,
         "Use styleProfile auto unless you intentionally want to override the structure style."
       )
     );
   }

   if (page.expression?.strategy && page.expression.strategy !== "auto" && page.expression.strategy !== guide.strategy) {
     warnings.push(
       diagnostic(
         "page.expression.strategy",
         "expression_strategy_mismatch",
         `${structure} usually maps to ${guide.strategy}, but expression.strategy is ${page.expression.strategy}.`,
         "Use strategy auto or match the selected structure strategy."
       )
     );
   }

  const expressionTypes = page.expressions.map((expression) => String(expression.type));
   const expectedPrimary = guide.expressionTypes.filter((type) => !["lead", "key-takeaways", "section-outline"].includes(type));

   if (expressionTypes.length > 0 && expectedPrimary.length > 0 && !expectedPrimary.some((type) => expressionTypes.includes(type))) {
     warnings.push(
       diagnostic(
         "page.expressions",
         "missing_structure_primary_expression",
         `${structure} pages usually need one of: ${expectedPrimary.join(", ")}.`,
         "Add the structure-specific semantic expression before final rendering."
       )
     );
   }

   return warnings;
 }

 async function createDryRunSummary(targetTool: PreflightTargetTool, page: AdaptiveThemeHtmlPageInput | InformationStructureHtmlPageOutput): Promise<Record<string, unknown>> {
   const html =
     targetTool === "render_information_structure_html"
       ? await renderInformationStructureInlineHtmlFragment(page as InformationStructureHtmlPageOutput)
       : await renderAdaptiveThemeInlineHtmlFragment(page as AdaptiveThemeHtmlPageInput);
   const rootDataAttribute = html.match(/data-html-render-mcp="([^"]+)"/)?.[1];

   return {
     renderable: true,
     htmlLength: html.length,
     rootDataAttribute,
     containsHtmlDocumentTag: /<!doctype|<html|<body/i.test(html),
     containsScript: /<script\b/i.test(html)
   };
 }

 export async function validateHtmlRenderPage(value: unknown): Promise<Record<string, unknown>> {
   const args = normalizeArguments(value);
   const rawPage = args.page;
   const errors: PreflightDiagnostic[] = [];
   const warnings: PreflightDiagnostic[] = [];
   let page: unknown;

   try {
     page = parseJsonString(rawPage, "page");
   } catch (error) {
     errors.push(
       diagnostic(
         "page",
         "invalid_json",
         `page must be an object or valid JSON string. ${formatUnknownError(error)}`,
         "Prefer passing page as a native object. If using a JSON string, escape quotes inside text and arrays correctly."
       )
     );

     return {
       targetTool: normalizeTargetTool(args.targetTool),
       readyToRender: false,
       errors,
       warnings,
       nextAction: "revise_page"
     };
   }

   const targetTool = normalizeTargetTool(args.targetTool, page);
   const tableDiagnostics = collectComparisonCellDiagnostics(page);
   errors.push(...tableDiagnostics.errors);
   warnings.push(...tableDiagnostics.warnings, ...collectDecisionMatrixWarnings(page), ...collectMarkdownWarnings(page));

   const schema = targetTool === "render_information_structure_html" ? informationStructureHtmlPageSchema : adaptiveThemeHtmlPageSchema;
   const parsed = schema.safeParse(page);
   let dryRun: Record<string, unknown> | undefined;

   if (!parsed.success) {
     errors.push(...zodDiagnostics(parsed.error));
   } else {
     warnings.push(...collectSemanticWarnings(targetTool, parsed.data));

     if (args.dryRun !== false) {
       try {
         dryRun = await createDryRunSummary(targetTool, parsed.data);

         if (dryRun.containsHtmlDocumentTag) {
           errors.push(
             diagnostic(
               "page",
               "dry_run_document_tag",
               "Dry-run output contains document-level tags.",
               "Final render output should be a continuous HTML fragment without doctype, html, or body tags."
             )
           );
         }

         if (dryRun.containsScript) {
           errors.push(
             diagnostic(
               "page",
               "dry_run_script_tag",
               "Dry-run output contains a script tag.",
               "Remove script-like content before final rendering."
             )
           );
         }
       } catch (error) {
         dryRun = { renderable: false, error: formatUnknownError(error) };
         errors.push(
           diagnostic(
             "page",
             "dry_run_failed",
             `The page passed schema validation but failed dry-run rendering: ${formatUnknownError(error)}`,
             "Revise the page object or report this as a renderer bug if the schema-valid object should render."
           )
         );
       }
     }
   }

   const readyToRender = errors.length === 0;

   return {
     targetTool,
     readyToRender,
     errors,
     warnings,
     dryRun,
     normalizedArguments: parsed.success ? { page: parsed.data } : undefined,
     nextAction: readyToRender ? `call_${targetTool}_once` : "revise_page"
   };
 }

 export const availablePreflightTargetTools = [...targetTools];
 export const availablePreflightStructures: InformationStructure[] = ["auto", ...Object.keys(structureGuides)] as InformationStructure[];
