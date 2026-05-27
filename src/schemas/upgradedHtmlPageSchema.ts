import { z } from "zod";
import { ctaSchema, footerSchema, linkSchema, themeSchema } from "./htmlPageSchema.js";

const upgradedContentTypes = [
  "news",
  "research",
  "explain",
  "compare",
  "tutorial",
  "list",
  "opinion"
] as const;

const upgradedBlockTypes = [
  "hero",
  "summary-card",
  "timeline",
  "stat-grid",
  "comparison-table",
  "quote",
  "risk-box",
  "faq",
  "steps",
  "source-list",
  "callout"
] as const;

export const upgradedContentTypeSchema = z.enum(upgradedContentTypes);
export const upgradedBlockTypeSchema = z.enum(upgradedBlockTypes);

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/, "Use a safe hex color, for example #2563eb");

export const upgradedDesignTokensSchema = z
  .object({
    primaryColor: hexColorSchema.optional(),
    accentColor: hexColorSchema.optional(),
    fontScale: z.enum(["compact", "normal", "large"]).optional(),
    cardRadius: z.enum(["none", "small", "medium", "large", "pill"]).optional(),
    spacingScale: z.enum(["compact", "normal", "relaxed"]).optional(),
    density: z.enum(["compact", "normal", "comfortable"]).optional(),
    borderStyle: z.enum(["none", "solid", "soft", "accent"]).optional(),
    shadowLevel: z.enum(["none", "soft", "medium", "strong"]).optional()
  })
  .optional();

const titledBodyItemSchema = z.object({
  title: z.string().min(1, "Item title is required"),
  body: z.string().min(1, "Item body is required")
});

const metricItemSchema = z.object({
  label: z.string().min(1, "Metric label is required"),
  value: z.string().min(1, "Metric value is required"),
  detail: z.string().optional()
});

const timelineItemSchema = z.object({
  time: z.string().optional(),
  title: z.string().min(1, "Timeline item title is required"),
  body: z.string().min(1, "Timeline item body is required")
});

const comparisonRowSchema = z.object({
  label: z.string().optional(),
  cells: z.array(z.string()).min(1, "At least one comparison cell is required")
});

const sourceItemSchema = linkSchema.extend({
  description: z.string().optional()
});

export const upgradedHtmlBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    eyebrow: z.string().optional(),
    title: z.string().min(1, "Hero title is required"),
    subtitle: z.string().optional(),
    meta: z.array(z.string()).optional(),
    highlights: z.array(metricItemSchema).optional(),
    cta: ctaSchema.optional()
  }),
  z.object({
    type: z.literal("summary-card"),
    title: z.string().min(1, "Summary title is required"),
    body: z.string().min(1, "Summary body is required"),
    items: z.array(titledBodyItemSchema).optional()
  }),
  z.object({
    type: z.literal("timeline"),
    title: z.string().min(1, "Timeline title is required"),
    intro: z.string().optional(),
    items: z.array(timelineItemSchema).min(1, "At least one timeline item is required")
  }),
  z.object({
    type: z.literal("stat-grid"),
    title: z.string().optional(),
    intro: z.string().optional(),
    items: z.array(metricItemSchema).min(1, "At least one stat item is required")
  }),
  z.object({
    type: z.literal("comparison-table"),
    title: z.string().min(1, "Comparison title is required"),
    intro: z.string().optional(),
    columns: z.array(z.string().min(1, "Column title is required")).min(2, "At least two columns are required"),
    rows: z.array(comparisonRowSchema).min(1, "At least one comparison row is required")
  }),
  z.object({
    type: z.literal("quote"),
    text: z.string().min(1, "Quote text is required"),
    source: z.string().optional()
  }),
  z.object({
    type: z.literal("risk-box"),
    title: z.string().min(1, "Risk title is required"),
    intro: z.string().optional(),
    items: z
      .array(
        titledBodyItemSchema.extend({
          severity: z.enum(["low", "medium", "high"]).optional()
        })
      )
      .min(1, "At least one risk item is required")
  }),
  z.object({
    type: z.literal("faq"),
    title: z.string().min(1, "FAQ title is required"),
    items: z
      .array(
        z.object({
          question: z.string().min(1, "Question is required"),
          answer: z.string().min(1, "Answer is required")
        })
      )
      .min(1, "At least one FAQ item is required")
  }),
  z.object({
    type: z.literal("steps"),
    title: z.string().min(1, "Steps title is required"),
    intro: z.string().optional(),
    items: z.array(titledBodyItemSchema).min(1, "At least one step is required")
  }),
  z.object({
    type: z.literal("source-list"),
    title: z.string().min(1, "Source list title is required"),
    intro: z.string().optional(),
    items: z.array(sourceItemSchema).min(1, "At least one source is required")
  }),
  z.object({
    type: z.literal("callout"),
    title: z.string().optional(),
    body: z.string().min(1, "Callout body is required"),
    tone: z.enum(["neutral", "info", "success", "warning", "danger"]).default("info")
  })
]);

export const upgradedHtmlPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  lang: z.string().default("zh-CN"),
  theme: themeSchema.default("modern-blue"),
  contentTypes: z.array(upgradedContentTypeSchema).min(1, "At least one content type is required").default(["research"]),
  tokens: upgradedDesignTokensSchema,
  blocks: z.array(upgradedHtmlBlockSchema).min(1, "At least one layout block is required"),
  footer: footerSchema
});

export type UpgradedContentType = z.infer<typeof upgradedContentTypeSchema>;
export type UpgradedDesignTokensInput = z.infer<typeof upgradedDesignTokensSchema>;
export type UpgradedHtmlBlockInput = z.infer<typeof upgradedHtmlBlockSchema>;
export type UpgradedHtmlPageInput = z.infer<typeof upgradedHtmlPageSchema>;

export const availableUpgradedContentTypes = [...upgradedContentTypes];
export const availableUpgradedBlockTypes = [...upgradedBlockTypes];
