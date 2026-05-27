import type { HtmlPageInput } from "../schemas/htmlPageSchema.js";
import { escapeAttribute, escapeHtml } from "../utils/escapeHtml.js";
import { formatHtml } from "../utils/formatHtml.js";
import { baseCss } from "./templates.js";

function renderSection(section: HtmlPageInput["sections"][number]): string {
  switch (section.type) {
    case "hero":
      return `
        <header class="section hero">
          <h1>${escapeHtml(section.heading)}</h1>
          ${section.subheading ? `<p>${escapeHtml(section.subheading)}</p>` : ""}
          ${
            section.cta
              ? `<a class="button" href="${escapeAttribute(section.cta.href)}">${escapeHtml(
                  section.cta.label
                )}</a>`
              : ""
          }
        </header>
      `;

    case "features":
      return `
        <section class="section">
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.intro ? `<p class="muted">${escapeHtml(section.intro)}</p>` : ""}
          <div class="grid">
            ${section.items
              .map(
                (item) => `
                  <article class="card">
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.body)}</p>
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
          <p>${escapeHtml(section.body)}</p>
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
                    <p class="muted">${escapeHtml(item.body)}</p>
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
                  <p class="muted">${escapeHtml(item.answer)}</p>
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
          .map(
            (link) =>
              `<a href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`
          )
          .join("")}
      </nav>`
    : "";

  return `
    <footer>
      ${footer.text ? `<p>${escapeHtml(footer.text)}</p>` : ""}
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
