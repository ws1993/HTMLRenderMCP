# Article HTML Generator Harness Implementation Plan - 2026-06-18

## Goal

Implement a stateless article-generation harness so agents can plan a long article, validate section drafts, assemble a final information-structure page object, validate that page, and call `render_information_structure_html` once.

## Architecture

Keep final renderers unchanged. Add a new article harness package that sits above render preflight:

- `src/schemas/articleHtmlGenerationSchema.ts` owns runtime contracts.
- `src/toolSchemas/articleHtmlGenerationInputSchemas.ts` owns MCP JSON schemas for the new article tools.
- `src/article/articleGuidance.ts` owns plan skeleton generation.
- `src/article/articlePlanValidation.ts` owns plan diagnostics.
- `src/article/articleSectionValidation.ts` owns section diagnostics.
- `src/article/articleAssembly.ts` owns final page object assembly.
- `src/tools/*Article*Tool.ts` owns tool handlers.
- `src/server/toolRegistry.ts` exposes the tools.

## Tech Stack

TypeScript, Zod, Node test runner, existing MCP SDK response helpers, existing renderer/preflight modules.

## Baseline/Authority Refs

- `README.md`
- `docs/architecture.md`
- `docs/aegis/baseline/2026-06-04-initial-baseline.md`
- `docs/aegis/specs/2026-06-04-html-render-preflight-tools-design.md`
- `docs/aegis/specs/2026-06-18-article-html-generator-harness-design.md`

## Compatibility Boundary

Existing final render tools and existing render preflight tools keep their public contracts. New article harness tools return JSON text content and never return final HTML. The final page object must remain compatible with `render_information_structure_html`.

## Verification

- `npm test -- src/test/articleHtmlGeneration.test.ts`
- `npm test`
- `npm run check`

## Architecture Integrity Lens

- Invariant: only final render tools produce final HTML.
- Canonical owner / contract: upstream article plan/section/assembly behavior belongs in `src/article`.
- Responsibility overlap: render preflight remains final-page validation; article harness validates upstream article production.
- Higher-level simplification: reuse existing adaptive expressions and upgraded blocks instead of adding a Reacticle clone.
- Retirement / falsifier: a future file-workspace article mode can wrap these primitives without changing final renderers.
- Verdict: proceed.

## Plan Pressure Test

- Owner / contract / retirement: four new public tools and one new source owner package.
- Architecture integrity / higher-level path: current `src/preflight` pattern is the closest precedent; do not put article logic there because it has a different lifecycle.
- Verification scope: unit tests for each harness stage plus one end-to-end dry-run.
- Task executability: split into schemas, behavior modules, tools/registry, docs.
- Pressure result: proceed.

## Plan-Time Complexity Check

- Target files: new `src/article` package, new schema files, new tool files, registry, tests, README, architecture docs.
- Existing size / shape signals: `htmlRenderPreflight.ts` is already a substantial owner for render readiness and should not absorb article workflow responsibilities.
- Owner fit: add a new `src/article` owner package.
- Better file boundary: create focused files by stage.
- Recommendation: add owner files.

## Tasks

### Task 1 - Write failing article harness tests

Files:

- Create `src/test/articleHtmlGeneration.test.ts`

Why: lock the intended public behavior before production code changes.

Impact/Compatibility: test-only change; no runtime behavior changes.

Verification: `npm test -- src/test/articleHtmlGeneration.test.ts` should fail because the article modules and tools do not exist yet.

Steps:

- [ ] Create `src/test/articleHtmlGeneration.test.ts` with imports for the planned functions and tools.
- [ ] Add a test that `guideArticleHtmlGeneration({ title: "Prompt Caching", articleType: "explainer" })` returns `targetStructure: "explain"` and `nextAction: "validate_article_html_plan"`.
- [ ] Add a test that `validateArticleHtmlPlan({ plan: { title: "Broken", sections: [] } })` returns at least one error diagnostic.
- [ ] Add a test that `validateArticleSectionDraft` rejects an unknown `sectionId`.
- [ ] Add a test that `assembleArticleHtmlPage` preserves section order and returns a page accepted by `informationStructureHtmlPageSchema`.
- [ ] Add a registry test that all four new tools are exposed.
- [ ] Run `npm test -- src/test/articleHtmlGeneration.test.ts` and confirm RED.

### Task 2 - Add article runtime schemas

Files:

- Create `src/schemas/articleHtmlGenerationSchema.ts`

Why: provide one canonical typed contract for plans, section drafts, diagnostics, and assembly inputs.

Impact/Compatibility: no public tool behavior yet; schema imports must not depend on tools or renderers.

Verification: focused test still fails later because behavior modules are absent, but TypeScript imports for schema types should be valid after Task 3.

Steps:

- [ ] Define `articleTypeSchema` with `longform`, `full-report`, `tutorial`, `explainer`, `dialogue`, `review`, `essay`, `briefing`, and `interactive-explainer`.
- [ ] Define `retentionTargetSchema` with `40-60%`, `60-80%`, `80-100%`, and `near-100%`.
- [ ] Define `articleDiagnosticSchema` with `path`, `code`, `message`, `fix`, and `severity`.
- [ ] Define `articleSectionPlanSchema` with `id`, `title`, `purpose`, `sourceCoverage`, `expressionPlan`, optional `visualPlan`, and `acceptanceChecks`.
- [ ] Define `articleGenerationPlanSchema` with `title`, `articleType`, `retentionTarget`, optional `audience`, `targetStructure`, optional `styleProfile`, `brief`, `sections`, and `reviewChecklist`.
- [ ] Define `articleSectionDraftSchema` with `sectionId`, `title`, `summary`, `sourceCoverage`, `expressions`, optional `blocks`, and optional `reviewNotes`, reusing `adaptiveExpressionSchema` and `upgradedHtmlBlockSchema`.
- [ ] Define input schemas for guidance, plan validation, section validation, and assembly.
- [ ] Export inferred TypeScript types for all public contracts.

### Task 3 - Implement guidance behavior

Files:

- Create `src/article/articleGuidance.ts`

Why: give callers a deterministic plan skeleton and recommended render direction before drafting sections.

Impact/Compatibility: new behavior only; no final rendering.

Verification: the guidance test from Task 1 should pass after this task and Task 2 compile.

Steps:

- [ ] Import article schemas and existing `informationStructureSchema` / adaptive style profile types as needed.
- [ ] Add article type to structure mapping: `explainer -> explain`, `full-report -> research`, `tutorial -> tutorial`, `review -> compare`, `essay -> opinion`, `interactive-explainer -> explain`, `dialogue -> opinion`, `briefing -> compare`, `longform -> explain`.
- [ ] Add structure to default expression plan mapping using existing expression names such as `lead`, `key-takeaways`, `section-outline`, `process-guide`, `decision-matrix`, `evidence-map`, `argument-map`, and `ranked-list`.
- [ ] Implement `guideArticleHtmlGeneration(args)` so it returns a JSON-serializable object containing `plan`, `recommendation`, `diagnostics`, and `nextAction: "validate_article_html_plan"`.
- [ ] Keep section skeletons small: hero/lead section plus two to four content sections depending on article type.
- [ ] Do not call renderers, file APIs, network APIs, or LLM APIs.

### Task 4 - Implement plan validation behavior

Files:

- Create `src/article/articlePlanValidation.ts`

Why: catch incomplete plans before long section drafting starts.

Impact/Compatibility: new validation only.

Verification: the broken plan test should pass.

Steps:

- [ ] Parse inputs with `articlePlanValidationInputSchema`.
- [ ] Return an error diagnostic for missing title, missing brief, missing `brief.coreViewpoint`, missing sections, duplicate section ids, empty section `sourceCoverage`, empty section `expressionPlan`, and empty section `acceptanceChecks`.
- [ ] Return a warning diagnostic when `styleProfile` is absent or `auto` and the structure has a strongly preferred profile.
- [ ] Return a warning diagnostic when `near-100%` retention has fewer than three sections.
- [ ] Return `{ ok, diagnostics, nextAction }`, where `nextAction` is `draft_article_sections` when no errors exist and `revise_article_plan` otherwise.

### Task 5 - Implement section validation behavior

Files:

- Create `src/article/articleSectionValidation.ts`

Why: preserve plan alignment and schema correctness while sections are drafted independently.

Impact/Compatibility: new validation only.

Verification: the unknown section id test should pass.

Steps:

- [ ] Parse inputs with `articleSectionValidationInputSchema`.
- [ ] Find the matching section plan by `draft.sectionId`.
- [ ] Return an error if no matching section exists.
- [ ] Return an error if both `draft.expressions` and `draft.blocks` are empty.
- [ ] Return an error for planned `sourceCoverage` items missing from `draft.sourceCoverage`.
- [ ] Rely on Zod parsing to report invalid expression/block shape.
- [ ] Return warnings for expression types not listed in the section plan.
- [ ] Return `{ ok, diagnostics, nextAction }`, where `nextAction` is `assemble_article_html_page` only when all planned sections are expected to be valid by the caller.

### Task 6 - Implement article assembly behavior

Files:

- Create `src/article/articleAssembly.ts`

Why: convert approved article artifacts into the existing final page input contract.

Impact/Compatibility: assembly must produce `InformationStructureHtmlPageInput` and must not render HTML.

Verification: the assembly parseability test should pass.

Steps:

- [ ] Parse inputs with `articleAssemblyInputSchema`.
- [ ] Sort drafts according to `plan.sections`.
- [ ] Compute missing section ids and uncovered source coverage items.
- [ ] Flatten section expressions and blocks in plan order.
- [ ] Create a final page with `title`, `description`, `structure`, `contentTypes`, `styleProfile`, `expression.coreViewpoint`, `expression.keyTakeaways`, `expressions`, `blocks`, and `footer`.
- [ ] Use `informationStructureHtmlPageSchema.safeParse(page)` to prove the assembled page contract.
- [ ] Return `{ page, diagnostics, coverageSummary, nextAction }`, where `nextAction` is `validate_html_render_page` only when no blocking diagnostics exist.

### Task 7 - Add MCP tool schemas and handlers

Files:

- Create `src/toolSchemas/articleHtmlGenerationInputSchemas.ts`
- Create `src/tools/guideArticleHtmlGenerationTool.ts`
- Create `src/tools/validateArticleHtmlPlanTool.ts`
- Create `src/tools/validateArticleSectionDraftTool.ts`
- Create `src/tools/assembleArticleHtmlPageTool.ts`

Why: expose the article harness through the MCP server consistently with existing tools.

Impact/Compatibility: four new public tools; existing tools unchanged.

Verification: registry exposure test should pass after Task 8.

Steps:

- [ ] Define MCP JSON schema constants for all four tools, mirroring the runtime schemas.
- [ ] Each handler should parse/delegate through its `src/article` function and return JSON text with `textContent(JSON.stringify(result, null, 2))`.
- [ ] Tool descriptions must say the tool does not fetch, write article prose, or render final HTML.
- [ ] Avoid duplicating validation logic inside tool handlers.
- [ ] Keep handler files small and consistent with existing `guideHtmlRenderPageTool.ts` and `validateHtmlRenderPageTool.ts`.

### Task 8 - Register tools and update docs

Files:

- Modify `src/server/toolRegistry.ts`
- Modify `README.md`
- Modify `docs/architecture.md`

Why: make the tools discoverable and document the recommended workflow.

Impact/Compatibility: public MCP tool list grows; existing disabled-tool message should mention the new article harness tools without implying they render final HTML.

Verification: registry test and docs review.

Steps:

- [ ] Import all four article harness tools in `src/server/toolRegistry.ts`.
- [ ] Add them before existing final render tools in `htmlRenderTools`.
- [ ] Update `disabledToolsMessage` to include article harness tools as upstream planning/assembly tools.
- [ ] Add a README section named `Article Harness Workflow`.
- [ ] Document the sequence: guide article -> validate plan -> validate sections -> assemble page -> validate render page -> render once.
- [ ] Update `docs/architecture.md` with `src/article/*` ownership and the article harness boundary.

### Task 9 - Full verification and repair

Files:

- All changed source, test, and docs files.

Why: prove the change is type-safe, behaviorally covered, and compatible with existing render flows.

Impact/Compatibility: only fix issues caused by this work.

Verification:

```powershell
npm test -- src/test/articleHtmlGeneration.test.ts
npm test
npm run check
```

Steps:

- [ ] Run the focused test command.
- [ ] Fix article harness failures.
- [ ] Run the full test suite.
- [ ] Fix only failures related to the new article harness.
- [ ] Run the typecheck/build command.
- [ ] Summarize commands and results.

## Risks

- Tool proliferation can confuse agents. Mitigation: names and descriptions use `article` and `nextAction` fields to guide order.
- "Generator" can imply the MCP server writes prose. Mitigation: README and tool descriptions state that the calling agent writes prose.
- The first version may feel less powerful than the source article's full Beautiful Article workflow. Mitigation: this plan intentionally defers file workspace, React, and PDF export.
- Plan/section validation may be too strict for short articles. Mitigation: keep quality concerns as warnings unless they break assembly or schema validity.

## Retirement

If a future file-workspace article mode is added, these stateless article harness functions can remain as the validation/assembly core. If final render tools later gain a standardized `mode: "plan"` contract, the guidance tool can retire or delegate to that contract.
