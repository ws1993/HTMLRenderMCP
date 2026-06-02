import { availableTemplates, availableThemes } from "../schemas/htmlPageSchema.js";
import { footerInputSchema, sectionInputSchema } from "./sharedInputSchema.js";

const pageInputSchema = {
  type: "object",
  required: ["title", "sections"],
  properties: {
    template: {
      type: "string",
      enum: availableTemplates,
      default: "landing-page"
    },
    title: { type: "string" },
    description: { type: "string" },
    lang: { type: "string", default: "zh-CN" },
    theme: {
      type: "string",
      enum: availableThemes,
      default: "modern-blue"
    },
    sections: {
      type: "array",
      minItems: 1,
      items: sectionInputSchema
    },
    footer: footerInputSchema
  }
} as const;

export const finalHtmlInputSchema = {
  type: "object",
  required: ["page"],
  properties: {
    page: {
      ...pageInputSchema,
      description:
        "Complete page object. Pass this as an object, not a JSON string; the server keeps JSON-string compatibility only as a legacy fallback."
    }
  }
} as const;
