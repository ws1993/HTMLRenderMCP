import {
  articlePlanValidationInputSchema,
  type ArticleDiagnostic,
  type ArticleGenerationPlan
} from "../schemas/articleHtmlGenerationSchema.js";
import type { ResolvedInformationStructure } from "../schemas/informationStructureHtmlPageSchema.js";
import { articleDiagnostic, hasBlockingDiagnostics } from "./shared.js";

const preferredStyleByStructure: Record<ResolvedInformationStructure, string> = {
  news: "old-newspaper",
  research: "academic-journal",
  explain: "clean-magazine",
  compare: "decision-brief",
  tutorial: "workshop-guide",
  list: "curated-list",
  opinion: "editorial-column"
};

function validatePlan(plan: ArticleGenerationPlan): ArticleDiagnostic[] {
  const diagnostics: ArticleDiagnostic[] = [];

  if (!plan.title.trim()) {
    diagnostics.push(articleDiagnostic("plan.title", "missing_title", "Article plan requires a title.", "Provide the final article title."));
  }

  if (!plan.brief.purpose.trim()) {
    diagnostics.push(articleDiagnostic("plan.brief.purpose", "missing_purpose", "Plan brief requires a purpose.", "State why this article exists."));
  }

  if (!plan.brief.coreViewpoint.trim()) {
    diagnostics.push(
      articleDiagnostic("plan.brief.coreViewpoint", "missing_core_viewpoint", "Plan brief requires a core viewpoint.", "State the article's central claim, finding, recommendation, or learning outcome.")
    );
  }

  if (!plan.brief.readerOutcome.trim()) {
    diagnostics.push(
      articleDiagnostic("plan.brief.readerOutcome", "missing_reader_outcome", "Plan brief requires a reader outcome.", "State what the reader should understand or decide after reading.")
    );
  }

  if (plan.sections.length === 0) {
    diagnostics.push(articleDiagnostic("plan.sections", "missing_sections", "Article plan needs at least one section.", "Add section tasks before drafting."));
  }

  const ids = new Set<string>();

  plan.sections.forEach((section, index) => {
    const path = `plan.sections[${index}]`;

    if (ids.has(section.id)) {
      diagnostics.push(articleDiagnostic(`${path}.id`, "duplicate_section_id", `Duplicate section id "${section.id}".`, "Use stable unique section ids."));
    }
    ids.add(section.id);

    if (section.sourceCoverage.length === 0) {
      diagnostics.push(articleDiagnostic(`${path}.sourceCoverage`, "missing_source_coverage", "Section needs source coverage targets.", "List the source claims or facts this section must preserve."));
    }

    if (section.expressionPlan.length === 0) {
      diagnostics.push(articleDiagnostic(`${path}.expressionPlan`, "missing_expression_plan", "Section needs an expression plan.", "List expected semantic expression types for this section."));
    }

    if (section.acceptanceChecks.length === 0) {
      diagnostics.push(articleDiagnostic(`${path}.acceptanceChecks`, "missing_acceptance_checks", "Section needs acceptance checks.", "Add checks that prove this section is complete."));
    }
  });

  if (!plan.styleProfile || plan.styleProfile === "auto") {
    diagnostics.push(
      articleDiagnostic(
        "plan.styleProfile",
        "auto_style_profile",
        `Style profile is auto; ${plan.targetStructure} usually resolves to ${preferredStyleByStructure[plan.targetStructure]}.`,
        "Keep auto for adaptive rendering or choose the profile deliberately.",
        "warning"
      )
    );
  }

  if (plan.retentionTarget === "near-100%" && plan.sections.length < 3) {
    diagnostics.push(
      articleDiagnostic(
        "plan.sections",
        "thin_near_full_retention_plan",
        "Near-100% retention usually needs at least three planned sections.",
        "Add enough section tasks to preserve the source structure.",
        "warning"
      )
    );
  }

  return diagnostics;
}

export function validateArticleHtmlPlan(value: unknown): {
  ok: boolean;
  diagnostics: ArticleDiagnostic[];
  nextAction: "draft_article_sections" | "revise_article_plan";
} {
  const { plan } = articlePlanValidationInputSchema.parse(value);
  const diagnostics = validatePlan(plan);
  const ok = !hasBlockingDiagnostics(diagnostics);

  return {
    ok,
    diagnostics,
    nextAction: ok ? "draft_article_sections" : "revise_article_plan"
  };
}
