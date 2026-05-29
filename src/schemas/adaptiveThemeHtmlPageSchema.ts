import { z } from "zod";
import { footerSchema } from "./htmlPageSchema.js";
import {
  upgradedContentTypeSchema,
  upgradedDesignTokensSchema,
  upgradedHtmlBlockSchema
} from "./upgradedHtmlPageSchema.js";

const adaptiveStyleProfiles = [
  "auto",
  "old-newspaper",
  "academic-journal",
  "clean-magazine",
  "decision-brief",
  "workshop-guide",
  "curated-list",
  "editorial-column"
] as const;

export const adaptiveStyleProfileSchema = z.enum(adaptiveStyleProfiles);

export const adaptiveThemeHtmlPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  lang: z.string().default("zh-CN"),
  contentTypes: z.array(upgradedContentTypeSchema).min(1, "At least one content type is required").default(["news"]),
  styleProfile: adaptiveStyleProfileSchema.default("auto"),
  tokens: upgradedDesignTokensSchema,
  blocks: z.array(upgradedHtmlBlockSchema).min(1, "At least one layout block is required"),
  footer: footerSchema
});

export type AdaptiveStyleProfile = z.infer<typeof adaptiveStyleProfileSchema>;
export type AdaptiveThemeHtmlPageInput = z.infer<typeof adaptiveThemeHtmlPageSchema>;

export const availableAdaptiveStyleProfiles = [...adaptiveStyleProfiles];
