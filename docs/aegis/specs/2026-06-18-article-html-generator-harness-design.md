# Article HTML Generator Harness Design - 2026-06-18

## Goal

Add an upstream article-generation harness for HTML Render MCP so agents can plan a long article, draft it section by section, validate section quality, assemble a final `render_information_structure_html` page object, and then call the existing final renderer once.

## Problem

`render_information_structure_html` is a stable one-shot final renderer, but long article production needs more than a final page schema. Agents need a guided process that keeps article intent, source coverage, section boundaries, visual strategy, and final render readiness aligned across a long task.

The source article about Beautiful Article / Reacticle shows a useful pattern:

- Use a harness to manage phases, checkpoints, state, review, and repair.
- Use a constrained semantic article protocol instead of free-form HTML.
- Keep final rendering stable by limiting the model to structured components and theme/token decisions.

This project already has the second half: information structures, adaptive expressions, style profiles, validation, and one-shot final rendering. It needs a small upstream harness, not a replacement renderer.

## Scope

Add four public MCP tools:

- `guide_article_html_generation`: returns an article plan skeleton, recommended article type, target information structure, style profile, expression sequence, section tasks, review checklist, and next action.
- `validate_article_html_plan`: validates the article plan before section drafting.
- `validate_article_section_draft`: validates one section draft against the approved plan and existing expression/block schemas.
- `assemble_article_html_page`: assembles an approved plan plus validated section drafts into a final `InformationStructureHtmlPageInput` object for `validate_html_render_page` and `render_information_structure_html`.

The tools are deterministic guidance, validation, and assembly helpers. They do not call an LLM, fetch web pages, write article files, open browsers, export PDF, or return final HTML.

## Non-goals

- Do not change the public contract of existing final render tools.
- Do not replace `guide_html_render_page` or `validate_html_render_page`.
- Do not add React, Vite, Reacticle, PDF export, or a file workspace in the first implementation.
- Do not create a server-side task queue, persistent session store, or multi-agent scheduler.
- Do not let the MCP server write the article text. The calling agent remains responsible for reading source material and drafting prose.

## Accepted Behavior

- Guidance can start from a title, source summary, target audience, article type hint, retention target, structure hint, and style hint.
- If no target structure is supplied, guidance chooses a structure from article type and intent. `explainer` maps to `explain`, `full-report` maps to `research`, `tutorial` maps to `tutorial`, `review` and comparison-heavy inputs map to `compare`, `essay` maps to `opinion`, `briefing` maps to `compare` or `research` depending on source intent, and generic longform defaults to `explain`.
- The plan contains a brief, section tasks, expected source coverage, expression plan, visual plan, and acceptance checks.
- Plan validation reports blocking errors for missing title, missing brief, missing sections, duplicate section ids, unsupported structure, unsupported article type, and section tasks without source coverage or acceptance checks.
- Section validation reports blocking errors when the section id is unknown, required source coverage is absent, no expression/block content exists, or expression/block schema validation fails.
- Section validation reports warnings when the section draft uses expression types not listed by the section plan, omits review notes for risky sections, or appears too thin for the retention target.
- Assembly preserves plan order, combines section expressions and blocks, creates a coherent `expression.coreViewpoint` / `expression.keyTakeaways`, sets `structure`, `contentTypes`, and `styleProfile`, and returns diagnostics plus `nextAction`.
- Assembly never returns rendered HTML. The next action is `validate_html_render_page` when ready.

## Architecture

Keep final renderers unchanged. Add a new article harness layer beside the existing preflight layer.

```txt
src/tools/*
  -> src/article/*
    -> src/schemas/*
    -> src/renderers/informationStructure/*
  -> src/preflight/*
  -> src/renderers/*
```

Ownership:

- `src/schemas/articleHtmlGenerationSchema.ts` owns runtime TypeScript/Zod contracts for article plan, section draft, and assembly inputs.
- `src/toolSchemas/articleHtmlGenerationInputSchemas.ts` owns MCP JSON schemas for the new tools.
- `src/article/articleGuidance.ts` owns plan skeleton generation and article type to structure/style recommendations.
- `src/article/articlePlanValidation.ts` owns deterministic plan diagnostics.
- `src/article/articleSectionValidation.ts` owns section-vs-plan diagnostics and expression/block schema checks.
- `src/article/articleAssembly.ts` owns plan plus sections to final page-object assembly.
- `src/tools/*Article*Tool.ts` files own MCP plumbing only.
- `src/server/toolRegistry.ts` remains the canonical exposure point.

## Data Contracts

`ArticleGenerationPlan`:

```ts
{
  title: string;
  articleType: "longform" | "full-report" | "tutorial" | "explainer" | "dialogue" | "review" | "essay" | "briefing" | "interactive-explainer";
  retentionTarget: "40-60%" | "60-80%" | "80-100%" | "near-100%";
  audience?: string;
  targetStructure: "news" | "research" | "explain" | "compare" | "tutorial" | "list" | "opinion";
  styleProfile?: "auto" | "old-newspaper" | "academic-journal" | "clean-magazine" | "decision-brief" | "workshop-guide" | "curated-list" | "editorial-column";
  brief: {
    purpose: string;
    coreViewpoint: string;
    readerOutcome: string;
  };
  sections: ArticleSectionPlan[];
  reviewChecklist: string[];
}
```

`ArticleSectionPlan`:

```ts
{
  id: string;
  title: string;
  purpose: string;
  sourceCoverage: string[];
  expressionPlan: string[];
  visualPlan?: string;
  acceptanceChecks: string[];
}
```

`ArticleSectionDraft`:

```ts
{
  sectionId: string;
  title: string;
  summary: string;
  sourceCoverage: string[];
  expressions: AdaptiveExpressionInput[];
  blocks?: UpgradedHtmlBlockInput[];
  reviewNotes?: string[];
}
```

`ArticleAssemblyResult`:

```ts
{
  page: InformationStructureHtmlPageInput;
  diagnostics: ArticleDiagnostic[];
  coverageSummary: {
    plannedSections: number;
    receivedSections: number;
    missingSectionIds: string[];
    uncoveredSourceItems: string[];
  };
  nextAction: "validate_html_render_page" | "revise_plan" | "revise_sections";
}
```

## Flow

Recommended caller flow:

1. The calling agent reads and summarizes source material.
2. The calling agent calls `guide_article_html_generation`.
3. The calling agent revises or accepts the plan.
4. The calling agent calls `validate_article_html_plan`.
5. The calling agent drafts each section.
6. The calling agent calls `validate_article_section_draft` for each section.
7. The calling agent calls `assemble_article_html_page`.
8. The calling agent calls `validate_html_render_page` with the assembled page.
9. The calling agent calls `render_information_structure_html` once.

## Compatibility Boundary

- Existing final render tools keep names, input schemas, output shape, and behavior.
- Existing preflight tools keep names, input schemas, output shape, and behavior.
- The new tools return JSON as text content, matching current tool response plumbing.
- Article harness tools may reuse existing adaptive expression and upgraded block schemas but must not duplicate renderer logic.
- If a final page is not ready, assembly returns diagnostics and `nextAction` instead of rendering or silently dropping content.

## Error Handling

Diagnostics use the same shape as existing preflight diagnostics where possible:

```ts
{
  path: string;
  code: string;
  message: string;
  fix: string;
  severity: "error" | "warning";
}
```

Blocking errors prevent `nextAction: "validate_html_render_page"`. Warnings keep the flow moving but tell the calling agent what to improve.

## Verification

- Add tests for guidance defaults and article type to structure mapping.
- Add tests for plan validation errors and warnings.
- Add tests for section validation against known and unknown section ids.
- Add tests for expression/block schema validation through section drafts.
- Add tests for assembly order, coverage summary, missing sections, and final page parseability with `informationStructureHtmlPageSchema`.
- Add an end-to-end test for guide -> validate plan -> validate section -> assemble -> validate render page dry-run.
- Run `npm test` and `npm run check`.

## Product Risk Lens

- Value: gives agents a stable article production path before the final renderer, reducing drift and late render failures.
- Non-goals: no built-in source fetching, no LLM generation, no file workspace, no Reacticle runtime.
- Trade-offs: a deterministic harness is less powerful than a full Beautiful Article workspace, but it fits the current MCP server boundary.
- Decision needed: proceed with stateless MCP tools first; defer file-workspace mode until real usage proves it is needed.

## Architecture Integrity Lens

- Invariant: final HTML is produced only by final render tools.
- Canonical owner / contract: article harness logic belongs in `src/article`, not renderers or existing preflight.
- Responsibility overlap: existing render preflight validates final page readiness; new article validation validates upstream plan and section readiness.
- Higher-level simplification: reuse current expression and block schemas rather than inventing a separate Reacticle-like component model.
- Retirement / falsifier: if the project later adopts a persistent article workspace, these stateless tools remain useful as validation primitives or can be wrapped by the workspace layer.
- Verdict: proceed.

## Task Intent Draft

- Outcome: agents can create long structured articles through a guided plan/section/assembly pipeline.
- Success evidence: tests show a plan can become a render-ready `InformationStructureHtmlPageInput` without changing final renderers.
- Stop condition: new tools are documented, tested, registered, and preserve existing renderer behavior.
- Non-goals: no HTML rendering inside article harness tools, no external fetch, no file exports.
- Risks: tool proliferation, ambiguous "generator" naming, and expectations that the MCP server writes article prose.

## Baseline Read Set Hint

- `README.md`
- `docs/architecture.md`
- `docs/aegis/baseline/2026-06-04-initial-baseline.md`
- `docs/aegis/specs/2026-06-04-html-render-preflight-tools-design.md`
- `src/preflight/htmlRenderPreflight.ts`
- `src/schemas/informationStructureHtmlPageSchema.ts`
- `src/schemas/adaptiveThemeHtmlPageSchema.ts`
- `src/server/toolRegistry.ts`

## Impact Statement Draft

- Affected layers: schemas, tool schemas, tools, registry, article harness module, tests, README, architecture notes.
- Public contract impact: four new MCP tools; no breaking changes.
- Runtime impact: deterministic validation/assembly only.
- Compatibility: existing render and preflight tools remain stable.
- ADR signal: public tool contract and new module ownership should be recorded if implementation ships.
