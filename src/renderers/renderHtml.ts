import type { HtmlPageInput } from "../schemas/htmlPageSchema.js";
import { escapeAttribute, escapeHtml } from "../utils/escapeHtml.js";
import { formatHtml } from "../utils/formatHtml.js";
import { normalizeRenderableHref } from "../utils/normalizeRenderableHref.js";
import { renderInlineRichTextParagraphs } from "../utils/renderInlineRichText.js";
import { baseCss } from "./templates.js";

function renderCta(cta: { label: string; href?: string } | undefined): string {
  const href = normalizeRenderableHref(cta?.href);

  if (!cta || !href) {
    return "";
  }

  return `<a class="button" href="${escapeAttribute(href)}">${escapeHtml(cta.label)}</a>`;
}

function renderParagraphGroup(
  value: unknown,
  options: {
    singleTag?: "p" | "div";
    singleClassName?: string;
    multiWrapperClassName?: string;
    multiParagraphClassName?: string;
  } = {}
): string {
  const paragraphs = renderInlineRichTextParagraphs(value);

  if (paragraphs.length === 0) {
    return "";
  }

  if (paragraphs.length === 1) {
    const tag = options.singleTag ?? "p";
    const classAttribute = options.singleClassName ? ` class="${escapeAttribute(options.singleClassName)}"` : "";

    return `<${tag}${classAttribute}>${paragraphs[0]}</${tag}>`;
  }

  const wrapperClassAttribute = options.multiWrapperClassName
    ? ` class="${escapeAttribute(options.multiWrapperClassName)}"`
    : "";
  const paragraphClassAttribute = options.multiParagraphClassName
    ? ` class="${escapeAttribute(options.multiParagraphClassName)}"`
    : "";

  return `<div${wrapperClassAttribute}>${paragraphs
    .map((paragraph) => `<p${paragraphClassAttribute}>${paragraph}</p>`)
    .join("")}</div>`;
}

function renderSection(section: HtmlPageInput["sections"][number]): string {
  switch (section.type) {
    case "hero":
      return `
        <header class="section hero">
          <h1>${escapeHtml(section.heading)}</h1>
          ${section.subheading ? renderParagraphGroup(section.subheading) : ""}
          ${renderCta(section.cta)}
        </header>
      `;

    case "features":
      return `
        <section class="section">
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.intro
            ? renderParagraphGroup(section.intro, {
                singleClassName: "muted",
                multiWrapperClassName: "rich-text-group rich-text-group-muted",
                multiParagraphClassName: "muted"
              })
            : ""}
          <div class="grid">
            ${section.items
              .map(
                (item) => `
                  <article class="card">
                    <h3>${escapeHtml(item.title)}</h3>
                    ${renderParagraphGroup(item.body, {
                      multiWrapperClassName: "rich-text-group"
                    })}
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `;

    case "content":
      return `
        <section class="section">
          <h2>${escapeHtml(section.heading)}</h2>
          ${renderParagraphGroup(section.body, {
            singleTag: "div",
            multiWrapperClassName: "rich-text-group rich-text-panel",
            singleClassName: "rich-text-panel rich-text-single-block"
          })}
        </section>
      `;

    case "steps":
      return `
        <section class="section">
          <h2>${escapeHtml(section.heading)}</h2>
          <div class="steps">
            ${section.items
              .map(
                (item) => `
                  <article class="step">
                    <h3>${escapeHtml(item.title)}</h3>
                    ${renderParagraphGroup(item.body, {
                      singleClassName: "muted",
                      multiWrapperClassName: "rich-text-group rich-text-group-muted",
                      multiParagraphClassName: "muted"
                    })}
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `;

    case "faq":
      return `
        <section class="section">
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.items
            .map(
              (item) => `
                <article class="faq-item">
                  <h3>${escapeHtml(item.question)}</h3>
                  ${renderParagraphGroup(item.answer, {
                    singleClassName: "muted",
                    multiWrapperClassName: "rich-text-group rich-text-group-muted",
                    multiParagraphClassName: "muted"
                  })}
                </article>
              `
            )
            .join("")}
        </section>
      `;
  }
}

function renderFooter(footer: HtmlPageInput["footer"]): string {
  if (!footer) {
    return "";
  }

  const links = footer.links?.length
    ? `<nav class="footer-links" aria-label="Footer links">
        ${footer.links
          .map((link) => {
            const href = normalizeRenderableHref(link.href);

            if (!href) {
              return "";
            }

            return `<a href="${escapeAttribute(href)}">${escapeHtml(link.label)}</a>`;
          })
          .join("")}
      </nav>`
    : "";

  return `
    <footer>
      ${footer.text
        ? renderParagraphGroup(footer.text, {
            multiWrapperClassName: "rich-text-group"
          })
        : ""}
      ${links}
    </footer>
  `;
}

export async function renderHtmlPage(input: HtmlPageInput): Promise<string> {
  const description = input.description ?? input.title;
  const rawHtml = `<!doctype html>
    <html lang="${escapeAttribute(input.lang)}">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${escapeAttribute(description)}" />
        <title>${escapeHtml(input.title)}</title>
        <style>
          ${baseCss(input.theme)}
        </style>
      </head>
      <body>
        <main class="page" data-template="${escapeAttribute(input.template)}">
          ${input.sections.map(renderSection).join("")}
          ${renderFooter(input.footer)}
        </main>
      </body>
    </html>`;

  return formatHtml(rawHtml);
}
