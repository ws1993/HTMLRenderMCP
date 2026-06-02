export const sectionInputSchema = {
  anyOf: [
    {
      type: "object",
      required: ["type", "heading"],
      properties: {
        type: { const: "hero" },
        heading: { type: "string" },
        subheading: { type: "string" },
        cta: {
          type: "object",
          properties: {
            label: { type: "string" },
            href: { type: "string", default: "#" }
          },
          required: ["label"]
        }
      }
    },
    {
      type: "object",
      required: ["type", "heading", "items"],
      properties: {
        type: { const: "features" },
        heading: { type: "string" },
        intro: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["title", "body"],
            properties: {
              title: { type: "string" },
              body: { type: "string" }
            }
          }
        }
      }
    },
    {
      type: "object",
      required: ["type", "heading", "body"],
      properties: {
        type: { const: "content" },
        heading: { type: "string" },
        body: { type: "string" }
      }
    },
    {
      type: "object",
      required: ["type", "heading", "items"],
      properties: {
        type: { const: "steps" },
        heading: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["title", "body"],
            properties: {
              title: { type: "string" },
              body: { type: "string" }
            }
          }
        }
      }
    },
    {
      type: "object",
      required: ["type", "heading", "items"],
      properties: {
        type: { const: "faq" },
        heading: { type: "string" },
        items: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["question", "answer"],
            properties: {
              question: { type: "string" },
              answer: { type: "string" }
            }
          }
        }
      }
    }
  ]
} as const;

export const footerInputSchema = {
  type: "object",
  properties: {
    text: { type: "string" },
    links: {
      type: "array",
      items: {
        type: "object",
        required: ["label"],
        properties: {
          label: { type: "string" },
          href: { type: "string", default: "#" }
        }
      }
    }
  }
} as const;
