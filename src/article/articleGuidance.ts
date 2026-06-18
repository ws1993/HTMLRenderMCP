import type { AdaptiveExpressionInput, AdaptiveStyleProfile } from "../schemas/adaptiveThemeHtmlPageSchema.js";
import {
  articleGuidanceInputSchema,
  type ArticleGenerationPlan,
  type ArticleType
} from "../schemas/articleHtmlGenerationSchema.js";
import type { ResolvedInformationStructure } from "../schemas/informationStructureHtmlPageSchema.js";

const structureByArticleType: Record<ArticleType, ResolvedInformationStructure> = {
  longform: "explain",
  "full-report": "research",
  tutorial: "tutorial",
  explainer: "explain",
  dialogue: "opinion",
  review: "compare",
  essay: "opinion",
  briefing: "compare",
  "interactive-explainer": "explain"
};

const styleProfileByStructure: Record<ResolvedInformationStructure, Exclude<AdaptiveStyleProfile, "auto">> = {
  news: "old-newspaper",
  research: "academic-journal",
  explain: "clean-magazine",
  compare: "decision-brief",
  tutorial: "workshop-guide",
  list: "curated-list",
  opinion: "editorial-column"
};

const expressionPlanByStructure: Record<ResolvedInformationStructure, Array<AdaptiveExpressionInput["type"]>> = {
  news: ["lead", "key-takeaways", "section-outline"],
  research: ["lead", "evidence-map", "section-outline"],
  explain: ["lead", "key-takeaways", "section-outline"],
  compare: ["executive-summary", "decision-matrix", "key-takeaways"],
  tutorial: ["lead", "process-guide", "key-takeaways"],
  list: ["lead", "ranked-list", "key-takeaways"],
  opinion: ["lead", "argument-map", "key-takeaways"]
};

function createSectionPlans(structure: ResolvedInformationStructure, title: string): ArticleGenerationPlan["sections"] {
  const expressions = expressionPlanByStructure[structure];
  const commonLead = {
    id: "lead",
    title: "Opening frame",
    purpose: `Establish the article promise for ${title}.`,
    sourceCoverage: ["core thesis"],
    expressionPlan: ["lead"],
    acceptanceChecks: ["States the central idea plainly.", "Sets reader expectations without decorative filler."]
  };

  switch (structure) {
    case "research":
      return [
        commonLead,
        {
          id: "evidence",
          title: "Evidence and limits",
          purpose: "Separate claims, evidence, confidence, and limitations.",
          sourceCoverage: ["main evidence", "known limitations"],
          expressionPlan: ["evidence-map"],
          acceptanceChecks: ["Links each claim to evidence.", "Calls out limitations."]
        },
        {
          id: "implications",
          title: "Implications",
          purpose: "Explain what the evidence changes for the reader.",
          sourceCoverage: ["practical implication"],
          expressionPlan: ["section-outline"],
          acceptanceChecks: ["Connects findings to practical meaning."]
        }
      ];
    case "compare":
      return [
        {
          id: "decision",
          title: "Decision first",
          purpose: "Give the recommendation before details.",
          sourceCoverage: ["decision context"],
          expressionPlan: ["executive-summary"],
          acceptanceChecks: ["States recommendation and scenario."]
        },
        {
          id: "matrix",
          title: "Criteria matrix",
          purpose: "Compare options using explicit criteria.",
          sourceCoverage: ["options", "criteria"],
          expressionPlan: ["decision-matrix"],
          acceptanceChecks: ["Defines criteria before scoring options."]
        }
      ];
    case "tutorial":
      return [
        commonLead,
        {
          id: "workflow",
          title: "Step-by-step workflow",
          purpose: "Turn the source into observable steps.",
          sourceCoverage: ["prerequisites", "steps", "checks"],
          expressionPlan: ["process-guide"],
          acceptanceChecks: ["Includes goal, steps, checkpoints, and checks."]
        }
      ];
    case "list":
      return [
        commonLead,
        {
          id: "catalog",
          title: "Curated catalog",
          purpose: "Rank or group items with fit and trade-offs.",
          sourceCoverage: ["selection criteria", "items"],
          expressionPlan: ["ranked-list"],
          acceptanceChecks: ["States selection criteria.", "Gives each item a fit or trade-off."]
        }
      ];
    case "opinion":
      return [
        commonLead,
        {
          id: "argument",
          title: "Argument path",
          purpose: "Develop thesis, reasons, counterarguments, and conclusion.",
          sourceCoverage: ["thesis", "reasons", "counterarguments"],
          expressionPlan: ["argument-map"],
          acceptanceChecks: ["Includes reasons and at least one counterargument."]
        }
      ];
    case "news":
      return [
        commonLead,
        {
          id: "context",
          title: "Context and follow-up",
          purpose: "Move from latest fact to context and next developments.",
          sourceCoverage: ["latest fact", "context", "follow-up"],
          expressionPlan: expressions,
          acceptanceChecks: ["Keeps the most important fact first."]
        }
      ];
    case "explain":
      return [
        commonLead,
        {
          id: "mechanism",
          title: "Mechanism",
          purpose: "Explain how the idea works in plain language.",
          sourceCoverage: ["mechanism", "example"],
          expressionPlan: ["section-outline"],
          acceptanceChecks: ["Explains mechanism before deeper detail."]
        },
        {
          id: "meaning",
          title: "Why it matters",
          purpose: "Connect the explanation to reader decisions or understanding.",
          sourceCoverage: ["reader impact"],
          expressionPlan: ["key-takeaways"],
          acceptanceChecks: ["Ends with reader-facing takeaways."]
        }
      ];
  }
}

export function guideArticleHtmlGeneration(value: unknown): {
  plan: ArticleGenerationPlan;
  recommendation: Record<string, unknown>;
  diagnostics: [];
  nextAction: "validate_article_html_plan";
} {
  const args = articleGuidanceInputSchema.parse(value);
  const articleType = args.articleType ?? "longform";
  const targetStructure = args.targetStructure ?? structureByArticleType[articleType];
  const retentionTarget = args.retentionTarget ?? (articleType === "briefing" ? "40-60%" : "80-100%");
  const styleProfile = args.styleProfile ?? "auto";
  const expressionPlan = expressionPlanByStructure[targetStructure];
  const plan: ArticleGenerationPlan = {
    title: args.title,
    description: args.description,
    articleType,
    retentionTarget,
    audience: args.audience,
    targetStructure,
    styleProfile,
    brief: {
      purpose: args.sourceSummary ?? `Turn source material into a structured ${articleType} article.`,
      coreViewpoint: "Replace with the article's central thesis, finding, recommendation, or reader outcome.",
      readerOutcome: "Replace with what the reader should understand or decide after reading."
    },
    sections: createSectionPlans(targetStructure, args.title),
    reviewChecklist: [
      "Editorial: each planned source item is covered by at least one section.",
      "Visual: expressions match the selected information structure and avoid decorative-only blocks.",
      "Technical: assembled page passes validate_html_render_page before final rendering."
    ]
  };

  return {
    plan,
    recommendation: {
      targetTool: "render_information_structure_html",
      targetStructure,
      styleProfile,
      resolvedStyleProfile: styleProfileByStructure[targetStructure],
      expressionPlan,
      finalRenderSequence: [
        "validate_article_html_plan",
        "validate_article_section_draft",
        "assemble_article_html_page",
        "validate_html_render_page",
        "render_information_structure_html"
      ]
    },
    diagnostics: [],
    nextAction: "validate_article_html_plan"
  };
}
