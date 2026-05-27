import { z } from "zod";

export const templateSchema = z.enum([
  "landing-page",
  "report",
  "article",
  "dashboard"
]);

export const themeSchema = z.enum([
  "modern-blue",
  "minimal-gray",
  "warm-orange",
  "dark-tech"
]);

export const ctaSchema = z.object({
  label: z.string().min(1, "CTA label is required"),
  href: z.string().default("#")
});

export const linkSchema = z.object({
  label: z.string().min(1, "Link label is required"),
  href: z.string().default("#")
});

const titledBodyItemSchema = z.object({
  title: z.string().min(1, "Item title is required"),
  body: z.string().min(1, "Item body is required")
});

export const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    heading: z.string().min(1, "Hero heading is required"),
    subheading: z.string().optional(),
    cta: ctaSchema.optional()
  }),
  z.object({
    type: z.literal("features"),
    heading: z.string().min(1, "Features heading is required"),
    intro: z.string().optional(),
    items: z.array(titledBodyItemSchema).min(1, "At least one feature is required")
  }),
  z.object({
    type: z.literal("content"),
    heading: z.string().min(1, "Content heading is required"),
    body: z.string().min(1, "Content body is required")
  }),
  z.object({
    type: z.literal("steps"),
    heading: z.string().min(1, "Steps heading is required"),
    items: z.array(titledBodyItemSchema).min(1, "At least one step is required")
  }),
  z.object({
    type: z.literal("faq"),
    heading: z.string().min(1, "FAQ heading is required"),
    items: z
      .array(
        z.object({
          question: z.string().min(1, "Question is required"),
          answer: z.string().min(1, "Answer is required")
        })
      )
      .min(1, "At least one FAQ item is required")
  })
]);

export const footerSchema = z
  .object({
    text: z.string().optional(),
    links: z.array(linkSchema).optional()
  })
  .optional();

export const htmlPageSchema = z.object({
  template: templateSchema.default("landing-page"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  lang: z.string().default("zh-CN"),
  theme: themeSchema.default("modern-blue"),
  sections: z.array(sectionSchema).min(1, "At least one section is required"),
  footer: footerSchema
});

export type HtmlPageInput = z.infer<typeof htmlPageSchema>;
export type HtmlSectionInput = z.infer<typeof sectionSchema>;
export type HtmlTemplate = z.infer<typeof templateSchema>;
export type HtmlTheme = z.infer<typeof themeSchema>;

export const availableTemplates = templateSchema.options;
export const availableThemes = themeSchema.options;
