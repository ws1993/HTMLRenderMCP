import type { HtmlPageInput, HtmlSectionInput, HtmlTheme } from "../schemas/htmlPageSchema.js";
import { escapeAttribute, escapeHtml } from "../utils/escapeHtml.js";
import { formatHtml } from "../utils/formatHtml.js";

interface InlineThemeTokens {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  primaryDark: string;
  border: string;
  soft: string;
  shadow: string;
}

const themes: Record<HtmlTheme, InlineThemeTokens> = {
  "modern-blue": {
    bg: "#f6f7fb",
    surface: "#ffffff",
    text: "#1f2937",
    muted: "#6b7280",
    primary: "#2563eb",
    primaryDark: "#1d4ed8",
    border: "#e5e7eb",
    soft: "#eff6ff",
    shadow: "0 16px 36px rgba(15, 23, 42, 0.08)"
  },
  "minimal-gray": {
    bg: "#f9fafb",
    surface: "#ffffff",
    text: "#111827",
    muted: "#6b7280",
    primary: "#374151",
    primaryDark: "#111827",
    border: "#e5e7eb",
    soft: "#f3f4f6",
    shadow: "0 14px 30px rgba(17, 24, 39, 0.06)"
  },
  "warm-orange": {
    bg: "#fff7ed",
    surface: "#ffffff",
    text: "#292524",
    muted: "#78716c",
    primary: "#ea580c",
    primaryDark: "#c2410c",
    border: "#fed7aa",
    soft: "#ffedd5",
    shadow: "0 16px 36px rgba(154, 52, 18, 0.12)"
  },
  "dark-tech": {
    bg: "#020617",
    surface: "#0f172a",
    text: "#e5e7eb",
    muted: "#94a3b8",
    primary: "#38bdf8",
    primaryDark: "#0284c7",
    border: "#1e293b",
    soft: "#082f49",
    shadow: "0 16px 36px rgba(0, 0, 0, 0.35)"
  }
};

function getInlineTheme(theme: HtmlTheme): InlineThemeTokens {
  return themes[theme] ?? themes["modern-blue"];
}

function style(rules: Record<string, string | number | undefined>): string {
  return Object.entries(rules)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");
}

function renderInlineSection(section: HtmlSectionInput, theme: InlineThemeTokens): string {
  const sectionStyleRules = {
    margin: "16px 0",
    padding: "24px",
    background: theme.surface,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    "border-radius": "20px",
    "box-shadow": theme.shadow,
    "font-family": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "line-height": "1.65"
  } satisfies Record<string, string | number | undefined>;
  const sectionStyle = style(sectionStyleRules);
  const h2Style = style({ margin: "0 0 12px", "font-size": "1.5rem", "line-height": "1.25" });
  const h3Style = style({ margin: "0 0 8px", "font-size": "1.05rem", "line-height": "1.35" });
  const mutedStyle = style({ margin: 0, color: theme.muted });

  switch (section.type) {
    case "hero":
      return `
        <header style="${escapeAttribute(
          style({
            ...sectionStyleRules,
            padding: "36px 28px",
            "text-align": "center",
            background: `linear-gradient(135deg, ${theme.soft}, ${theme.surface})`
          })
        )}">
          <h1 style="${escapeAttribute(
            style({ margin: 0, "font-size": "clamp(1.8rem, 4vw, 3rem)", "line-height": "1.1" })
          )}">${escapeHtml(section.heading)}</h1>
          ${
            section.subheading
              ? `<p style="${escapeAttribute(
                  style({ margin: "16px auto 0", "max-width": "680px", color: theme.muted })
                )}">${escapeHtml(section.subheading)}</p>`
              : ""
          }
          ${
            section.cta
              ? `<a href="${escapeAttribute(section.cta.href)}" style="${escapeAttribute(
                  style({
                    display: "inline-block",
                    margin: "22px 0 0",
                    padding: "10px 18px",
                    background: theme.primary,
                    color: "#ffffff",
                    "border-radius": "999px",
                    "font-weight": 700,
                    "text-decoration": "none"
                  })
                )}">${escapeHtml(section.cta.label)}</a>`
              : ""
          }
        </header>
      `;

    case "features":
      return `
        <section style="${escapeAttribute(sectionStyle)}">
          <h2 style="${escapeAttribute(h2Style)}">${escapeHtml(section.heading)}</h2>
          ${section.intro ? `<p style="${escapeAttribute(mutedStyle)}">${escapeHtml(section.intro)}</p>` : ""}
          <div style="${escapeAttribute(
            style({ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", margin: "18px 0 0" })
          )}">
            ${section.items
              .map(
                (item) => `
                  <article style="${escapeAttribute(
                    style({ padding: "16px", border: `1px solid ${theme.border}`, "border-radius": "16px", background: theme.soft })
                  )}">
                    <h3 style="${escapeAttribute(h3Style)}">${escapeHtml(item.title)}</h3>
                    <p style="${escapeAttribute(mutedStyle)}">${escapeHtml(item.body)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `;

    case "content":
      return `
        <section style="${escapeAttribute(sectionStyle)}">
          <h2 style="${escapeAttribute(h2Style)}">${escapeHtml(section.heading)}</h2>
          <p style="${escapeAttribute(style({ margin: 0 }))}">${escapeHtml(section.body)}</p>
        </section>
      `;

    case "steps":
      return `
        <section style="${escapeAttribute(sectionStyle)}">
          <h2 style="${escapeAttribute(h2Style)}">${escapeHtml(section.heading)}</h2>
          <div style="${escapeAttribute(style({ display: "grid", gap: "12px", margin: "18px 0 0" }))}">
            ${section.items
              .map(
                (item, index) => `
                  <article style="${escapeAttribute(
                    style({ display: "grid", "grid-template-columns": "36px 1fr", gap: "12px", padding: "16px", border: `1px solid ${theme.border}`, "border-radius": "16px", background: theme.surface })
                  )}">
                    <div style="${escapeAttribute(
                      style({ width: "32px", height: "32px", "border-radius": "999px", background: theme.primary, color: "#ffffff", display: "grid", "place-items": "center", "font-weight": 700 })
                    )}">${index + 1}</div>
                    <div>
                      <h3 style="${escapeAttribute(h3Style)}">${escapeHtml(item.title)}</h3>
                      <p style="${escapeAttribute(mutedStyle)}">${escapeHtml(item.body)}</p>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `;

    case "faq":
      return `
        <section style="${escapeAttribute(sectionStyle)}">
          <h2 style="${escapeAttribute(h2Style)}">${escapeHtml(section.heading)}</h2>
          ${section.items
            .map(
              (item) => `
                <article style="${escapeAttribute(
                  style({ padding: "14px 0", "border-top": `1px solid ${theme.border}` })
                )}">
                  <h3 style="${escapeAttribute(h3Style)}">${escapeHtml(item.question)}</h3>
                  <p style="${escapeAttribute(mutedStyle)}">${escapeHtml(item.answer)}</p>
                </article>
              `
            )
            .join("")}
        </section>
      `;
  }
}

function renderInlineFooter(footer: HtmlPageInput["footer"], theme: InlineThemeTokens): string {
  if (!footer) {
    return "";
  }

  const links = footer.links?.length
    ? `<div style="${escapeAttribute(style({ display: "flex", "flex-wrap": "wrap", gap: "10px", "justify-content": "center", margin: "10px 0 0" }))}">
        ${footer.links
          .map(
            (link) =>
              `<a href="${escapeAttribute(link.href)}" style="${escapeAttribute(style({ color: theme.primaryDark, "font-weight": 600, "text-decoration": "none" }))}">${escapeHtml(link.label)}</a>`
          )
          .join("")}
      </div>`
    : "";

  return `
    <footer style="${escapeAttribute(
      style({ margin: "22px 0 0", color: theme.muted, "text-align": "center", "font-size": "0.95rem" })
    )}">
      ${footer.text ? `<p style="${escapeAttribute(style({ margin: 0 }))}">${escapeHtml(footer.text)}</p>` : ""}
      ${links}
    </footer>
  `;
}

export async function renderInlineHtmlFragment(input: HtmlPageInput): Promise<string> {
  const theme = getInlineTheme(input.theme);
  const html = `
    <div data-html-render-mcp="inline" data-template="${escapeAttribute(input.template)}" style="${escapeAttribute(
      style({
        margin: "12px 0",
        padding: "16px",
        background: theme.bg,
        color: theme.text,
        "border-radius": "24px",
        "font-family": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        "line-height": "1.65"
      })
    )}">
      ${input.sections.map((section) => renderInlineSection(section, theme)).join("")}
      ${renderInlineFooter(input.footer, theme)}
    </div>
  `;

  return formatHtml(html);
}

export async function renderInlineSectionFragment(
  section: HtmlSectionInput,
  themeName: HtmlTheme = "modern-blue"
): Promise<string> {
  const theme = getInlineTheme(themeName);
  const html = `
    <div data-html-render-mcp="inline-section" style="${escapeAttribute(
      style({
        margin: "12px 0",
        color: theme.text,
        "font-family": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        "line-height": "1.65"
      })
    )}">
      ${renderInlineSection(section, theme)}
    </div>
  `;

  return formatHtml(html);
}
