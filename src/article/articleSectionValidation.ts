import {
  articleSectionValidationInputSchema,
  type ArticleDiagnostic
} from "../schemas/articleHtmlGenerationSchema.js";
import { articleDiagnostic, hasBlockingDiagnostics } from "./shared.js";

export function validateArticleSectionDraft(value: unknown): {
  ok: boolean;
  diagnostics: ArticleDiagnostic[];
  nextAction: "assemble_article_html_page" | "revise_article_section";
} {
  const { plan, draft } = articleSectionValidationInputSchema.parse(value);
  const diagnostics: ArticleDiagnostic[] = [];
  const sectionIndex = plan.sections.findIndex((section) => section.id === draft.sectionId);
  const section = plan.sections[sectionIndex];

  if (!section) {
    diagnostics.push(
      articleDiagnostic(
        "draft.sectionId",
        "unknown_section_id",
        `Section id "${draft.sectionId}" does not exist in the article plan.`,
        "Use one of the planned section ids or revise the plan first."
      )
    );
  }

  if (draft.expressions.length === 0 && draft.blocks.length === 0) {
    diagnostics.push(
      articleDiagnostic(
        "draft.expressions",
        "missing_section_content",
        "Section draft needs at least one expression or block.",
        "Add semantic expressions first; use blocks only for compatibility or visual support."
      )
    );
  }

  if (section) {
    const missingCoverage = section.sourceCoverage.filter((item) => !draft.sourceCoverage.includes(item));

    missingCoverage.forEach((item) => {
      diagnostics.push(
        articleDiagnostic(
          "draft.sourceCoverage",
          "missing_planned_source_coverage",
          `Draft does not cover planned source item "${item}".`,
          "Add this item to draft.sourceCoverage after preserving it in the section."
        )
      );
    });

    draft.expressions.forEach((expression, expressionIndex) => {
      if (!section.expressionPlan.includes(expression.type)) {
        diagnostics.push(
          articleDiagnostic(
            `draft.expressions[${expressionIndex}].type`,
            "expression_not_in_section_plan",
            `Expression type "${expression.type}" was not listed in the section plan.`,
            "Either revise the section plan or use one of the planned expression types.",
            "warning"
          )
        );
      }
    });
  }

  const ok = !hasBlockingDiagnostics(diagnostics);

  return {
    ok,
    diagnostics,
    nextAction: ok ? "assemble_article_html_page" : "revise_article_section"
  };
}
