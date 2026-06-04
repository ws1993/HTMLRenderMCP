 # HTML Render Preflight Tools Implementation Plan - 2026-06-04

 ## Goal

 Implement preflight guidance and validation MCP tools so adaptive and information-structure pages can be checked before the final one-shot HTML renderer runs.

 ## Architecture

 Keep final renderers unchanged. Add small preflight modules that sit beside existing schemas, tool schemas, and tool handlers:

 - `src/preflight/htmlRenderPreflight.ts` owns guidance, validation, semantic warnings, and dry-run summaries.
 - `src/toolSchemas/*` owns public MCP JSON schemas for the two new tools.
 - `src/tools/*` owns the two handlers.
 - `src/server/toolRegistry.ts` remains the exposure point.

 ## Tech Stack

 TypeScript, Zod, Node test runner, existing MCP SDK response helpers.

 ## Baseline/Authority Refs

 - `README.md`
 - `docs/architecture.md`
 - `docs/aegis/specs/2026-06-04-html-render-preflight-tools-design.md`
 - `docs/aegis/baseline/2026-06-04-initial-baseline.md`

 ## Compatibility Boundary

 Existing render tools remain final HTML-only tools. Preflight tools return JSON summaries as text and never return full final HTML.

 ## Verification

 - `npm test -- src/test/htmlRenderPreflight.test.ts`
 - `npm test`
 - `npm run check`

 ## Architecture Integrity Lens

 - Invariant: final render tools remain the only producers of final HTML fragments.
 - Canonical owner / contract: preflight behavior belongs in a new `src/preflight` module; tool handlers only normalize and delegate.
 - Responsibility overlap: Zod schemas stay canonical for shape validation; preflight adds explanations and semantic readiness checks.
 - Higher-level simplification: reuse existing render facades for dry-runs instead of duplicating render logic.
 - Retirement / falsifier: if future final tools expose built-in preflight modes, the standalone validator can retire.
 - Verdict: proceed.

 ## Plan Pressure Test

 - Owner / contract / retirement: new public MCP tools, registry updates, docs updates.
 - Architecture integrity / higher-level path: use existing schemas and renderers.
 - Verification scope: producer tests for guidance/validation plus registry tests.
 - Task executability: one focused source slice plus docs.
 - Pressure result: proceed.

 ## Plan-Time Complexity Check

 - Target files: tool registry, new tool handlers, new schemas, new preflight module, tests, docs.
 - Existing size / shape signals: registry is small; renderer facades should not receive validation logic.
 - Owner fit: new `src/preflight` file avoids bloating tools or renderers.
 - Better file boundary: add owner file.
 - Recommendation: add owner file.

 ## Tasks

 ### Task 1 - Write failing preflight tests

 Files: `src/test/htmlRenderPreflight.test.ts`

 Why: lock the public behavior before source edits.

 Verification: `npm test -- src/test/htmlRenderPreflight.test.ts` should fail because new tools do not exist.

 Steps:

 - [ ] Write tests for guidance output, validation error for string `cells`, markdown warning, ready dry-run, and registry exposure.
 - [ ] Run `npm test -- src/test/htmlRenderPreflight.test.ts` and confirm RED.
 - [ ] Do not edit production code in this task.
 - [ ] Record expected failure as missing modules/tools.
 - [ ] Continue to Task 2.

 ### Task 2 - Implement preflight owner module and tool handlers

 Files: `src/preflight/htmlRenderPreflight.ts`, `src/tools/guideHtmlRenderPageTool.ts`, `src/tools/validateHtmlRenderPageTool.ts`, `src/toolSchemas/htmlRenderGuidanceInputSchema.ts`, `src/toolSchemas/htmlRenderValidationInputSchema.ts`

 Why: provide guidance and validation without changing final renderers.

 Verification: `npm test -- src/test/htmlRenderPreflight.test.ts` should pass.

 Steps:

 - [ ] Add preflight target normalization and page parsing.
 - [ ] Reuse existing adaptive and information-structure Zod schemas for shape validation.
 - [ ] Add semantic warnings for structure/profile/strategy mismatches, string table cells, Markdown code fences, Markdown tables, headings, bullets, and bold markers.
 - [ ] Add dry-run summaries using existing render facades and never return full HTML.
 - [ ] Implement tool handlers that return JSON through `textContent`.

 ### Task 3 - Register tools and update public docs

 Files: `src/server/toolRegistry.ts`, `README.md`, `docs/architecture.md`

 Why: expose the new tools and document the recommended preflight workflow.

 Verification: registry test passes and docs describe the new sequence.

 Steps:

 - [ ] Import and append both preflight tools in `src/server/toolRegistry.ts`.
 - [ ] Update disabled-tool message to list the two preflight tools.
 - [ ] Add README descriptions and recommended prompts for guidance, validation, and final rendering.
 - [ ] Update architecture docs with `src/preflight` ownership.
 - [ ] Re-run focused tests.

 ### Task 4 - Full verification

 Files: all changed files.

 Why: prove the public contract and TypeScript wiring are stable.

 Verification: `npm test` and `npm run check` pass.

 Steps:

 - [ ] Run `npm test`.
 - [ ] Run `npm run check`.
 - [ ] Fix only issues related to this feature.
 - [ ] Re-run failing checks until green.
 - [ ] Summarize evidence.

 ## Risks

 - Tool proliferation can confuse agents. Mitigation: tool descriptions and README make preflight tools non-final and final render tools final-only.
 - Semantic warnings can be too strict. Mitigation: keep schema failures as errors and quality checks as warnings unless rendering would be structurally wrong.
 - Dry-runs can be expensive for huge pages. Mitigation: return summary only and keep dry-run optional.

 ## Retirement

 The preflight tools can retire if final renderers later support a standardized `mode: "validate"` contract without returning HTML.
