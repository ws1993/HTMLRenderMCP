import assert from "node:assert/strict";
import test from "node:test";
import { assembleArticleHtmlPage } from "../article/articleAssembly.js";
import { guideArticleHtmlGeneration } from "../article/articleGuidance.js";
import { validateArticleHtmlPlan } from "../article/articlePlanValidation.js";
import { validateArticleSectionDraft } from "../article/articleSectionValidation.js";
import { informationStructureHtmlPageSchema } from "../schemas/informationStructureHtmlPageSchema.js";
import { getToolByName, listToolDefinitions } from "../server/toolRegistry.js";
import { assembleArticleHtmlPageTool } from "../tools/assembleArticleHtmlPageTool.js";
import { guideArticleHtmlGenerationTool } from "../tools/guideArticleHtmlGenerationTool.js";
import { validateArticleHtmlPlanTool } from "../tools/validateArticleHtmlPlanTool.js";
import { validateArticleSectionDraftTool } from "../tools/validateArticleSectionDraftTool.js";

const validPlan = {
  title: "Prompt Caching",
  articleType: "explainer",
  retentionTarget: "80-100%",
  targetStructure: "explain",
  styleProfile: "auto",
  brief: {
    purpose: "Explain why prompt caching matters to agents.",
    coreViewpoint: "Prompt caching turns repeated context from a cost center into reusable infrastructure.",
    readerOutcome: "Readers understand when to design prompts for cache reuse."
  },
  sections: [
    {
      id: "lead",
      title: "Why it matters",
      purpose: "Frame the central idea.",
      sourceCoverage: ["cache economics"],
      expressionPlan: ["lead"],
      acceptanceChecks: ["States the core idea plainly."]
    },
    {
      id: "mechanics",
      title: "How it works",
      purpose: "Explain the mechanism.",
      sourceCoverage: ["stable prefix", "cache hits"],
      expressionPlan: ["section-outline"],
      acceptanceChecks: ["Explains stable prefixes and cache hits."]
    }
  ],
  reviewChecklist: ["Editorial: source claims are preserved.", "Technical: final page validates."]
};

test("guideArticleHtmlGeneration maps explainer articles to explain structure", () => {
  const result = guideArticleHtmlGeneration({
    title: "Prompt Caching",
    articleType: "explainer"
  });

  assert.equal(result.plan.targetStructure, "explain");
  assert.equal(result.nextAction, "validate_article_html_plan");
  assert.ok(result.plan.sections.length >= 2);
});

test("validateArticleHtmlPlan reports errors for incomplete plans", () => {
  const result = validateArticleHtmlPlan({
    plan: {
      title: "Broken",
      articleType: "explainer",
      retentionTarget: "80-100%",
      targetStructure: "explain",
      brief: {
        purpose: "",
        coreViewpoint: "",
        readerOutcome: ""
      },
      sections: [],
      reviewChecklist: []
    }
  });

  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.severity === "error"));
  assert.equal(result.nextAction, "revise_article_plan");
});

test("validateArticleSectionDraft rejects drafts for unknown sections", () => {
  const result = validateArticleSectionDraft({
    plan: validPlan,
    draft: {
      sectionId: "missing",
      title: "Missing",
      summary: "A section that is not in the plan.",
      sourceCoverage: ["cache economics"],
      expressions: [
        {
          type: "lead",
          body: "Prompt caching matters because repeated context can be reused."
        }
      ]
    }
  });

  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "unknown_section_id"));
});

test("assembleArticleHtmlPage preserves section order and returns a renderable page object", () => {
  const result = assembleArticleHtmlPage({
    plan: validPlan,
    sections: [
      {
        sectionId: "mechanics",
        title: "How it works",
        summary: "Stable prefixes make cache hits likely.",
        sourceCoverage: ["stable prefix", "cache hits"],
        expressions: [
          {
            type: "section-outline",
            title: "Mechanics",
            sections: [{ title: "Stable prefix", body: "Keep reusable context before volatile task text." }]
          }
        ]
      },
      {
        sectionId: "lead",
        title: "Why it matters",
        summary: "Prompt caching improves agent economics.",
        sourceCoverage: ["cache economics"],
        expressions: [
          {
            type: "lead",
            title: "Prompt Caching",
            body: "Prompt caching turns repeated context from a cost center into reusable infrastructure."
          }
        ]
      }
    ]
  });

  assert.equal(result.nextAction, "validate_html_render_page");
  assert.equal(result.page.expressions?.[0]?.type, "lead");
  assert.equal(result.page.expressions?.[1]?.type, "section-outline");
  assert.equal(informationStructureHtmlPageSchema.safeParse(result.page).success, true);
});

test("article harness tools are registered", () => {
  const definitions = listToolDefinitions();

  assert.ok(definitions.some((tool) => tool.name === "guide_article_html_generation"));
  assert.ok(definitions.some((tool) => tool.name === "validate_article_html_plan"));
  assert.ok(definitions.some((tool) => tool.name === "validate_article_section_draft"));
  assert.ok(definitions.some((tool) => tool.name === "assemble_article_html_page"));
  assert.equal(getToolByName("guide_article_html_generation"), guideArticleHtmlGenerationTool);
  assert.equal(getToolByName("validate_article_html_plan"), validateArticleHtmlPlanTool);
  assert.equal(getToolByName("validate_article_section_draft"), validateArticleSectionDraftTool);
  assert.equal(getToolByName("assemble_article_html_page"), assembleArticleHtmlPageTool);
});
