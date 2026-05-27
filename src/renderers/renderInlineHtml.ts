import type { HtmlPageInput, HtmlSectionInput, HtmlTheme } from "../schemas/htmlPageSchema.js";
import { escapeAttribute, escapeHtml } from "../utils/escapeHtml.js";
import { formatHtml } from "../utils/formatHtml.js";
import { normalizeRenderableHref } from "../utils/normalizeRenderableHref.js";
import { renderInlineRichTextParagraphs } from "../utils/renderInlineRichText.js";

interface InlineThemeTokens {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  border: string;
  borderSubtle: string;
  shadow: string;
  badgeBg: string;
  badgeText: string;
}

const themes: Record<HtmlTheme, InlineThemeTokens> = {
  "modern-blue": {
    bg: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    muted: "#64748b",
    primary: "#2563eb",
    primarySoft: "#eff6ff",
    border: "#cbd5e1",
    borderSubtle: "#e2e8f0",
    shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
    badgeBg: "#e0f2fe",
    badgeText: "#0369a1"
  },
  "minimal-gray": {
    bg: "#fafafa",
    surface: "#ffffff",
    text: "#18181b",
    muted: "#71717a",
    primary: "#18181b",
    primarySoft: "#f4f4f5",
    border: "#d4d4d8",
    borderSubtle: "#e4e4e7",
    shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
    badgeBg: "#f4f4f5",
    badgeText: "#27272a"
  },
  "dark-tech": {
    bg: "#09090b",
    surface: "#18181b",
    text: "#fafafa",
    muted: "#a1a1aa",
    primary: "#3b82f6",
    primarySoft: "rgba(59, 130, 246, 0.15)",
    border: "#3f3f46",
    borderSubtle: "#27272a",
    shadow: "0 8px 16px rgba(0, 0, 0, 0.4)",
    badgeBg: "rgba(255, 255, 255, 0.1)",
    badgeText: "#e4e4e7"
  },
  "warm-orange": {
    bg: "#fffbeb",
    surface: "#ffffff",
    text: "#451a03",
    muted: "#78350f",
    primary: "#d97706",
    primarySoft: "#fef3c7",
    border: "#fcd34d",
    borderSubtle: "#fde68a",
    shadow: "0 4px 6px -1px rgba(217, 119, 6, 0.05)",
    badgeBg: "#ffedd5",
    badgeText: "#c2410c"
  }
};

function getInlineTheme(theme: HtmlTheme): InlineThemeTokens {
  return themes[theme] ?? themes["modern-blue"];
}

function style(rules: Record<string, string | number | undefined>): string {
  return Object.entries({
    ...rules,
    "text-align": "left !important",
    "text-indent": "0 !important",
    "white-space": "normal !important"
  })
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");
}

function renderInlineCta(
  cta: { label: string; href?: string } | undefined,
  theme: InlineThemeTokens
): string {
  const href = normalizeRenderableHref(cta?.href);

  if (!cta || !href) {
    return "";
  }

  return `<a href="${escapeAttribute(href)}" style="${escapeAttribute(
    style({
      display: "inline-block",
      "margin-top": "16px",
      padding: "8px 16px",
      background: theme.primary,
      color: "#ffffff",
      "text-decoration": "none",
      "border-radius": "6px",
      "font-size": "14px",
      "font-weight": 500
    })
  )}">${escapeHtml(cta.label)}</a>`;
}

function renderInlineParagraphGroup(
  value: unknown,
  options: {
    singleTag?: "p" | "div";
    singleStyle?: string;
    multiWrapperStyle?: string;
    multiParagraphStyle?: string;
  } = {}
): string {
  const paragraphs = renderInlineRichTextParagraphs(value);

  if (paragraphs.length === 0) {
    return "";
  }

  if (paragraphs.length === 1) {
    const tag = options.singleTag ?? "p";
    const styleAttribute = options.singleStyle ? ` style="${escapeAttribute(options.singleStyle)}"` : "";

    return `<${tag}${styleAttribute}>${paragraphs[0]}</${tag}>`;
  }

  const wrapperStyleAttribute = options.multiWrapperStyle
    ? ` style="${escapeAttribute(options.multiWrapperStyle)}"`
    : "";
  const paragraphStyleAttribute = options.multiParagraphStyle
    ? ` style="${escapeAttribute(options.multiParagraphStyle)}"`
    : "";

  return `<div${wrapperStyleAttribute}>${paragraphs
    .map((paragraph) => `<p${paragraphStyleAttribute}>${paragraph}</p>`)
    .join("")}</div>`;
}

function renderInlineSection(section: HtmlSectionInput, theme: InlineThemeTokens, isFirst: boolean): string {
  const sectionWrapperStyle = style({
    padding: "24px",
    background: theme.surface,
    "border-top": isFirst ? "none" : `1px solid ${theme.borderSubtle}`
  });

  const sectionHeaderStyle = style({
    margin: "0 0 16px 0",
    "font-size": "17px",
    "font-weight": 600,
    color: theme.text,
    "letter-spacing": "-0.01em"
  });

  switch (section.type) {
    case "hero":
      return `
        <div style="${escapeAttribute(
          style({
            padding: "24px",
            background: theme.surface,
            "border-top": isFirst ? "none" : `1px solid ${theme.borderSubtle}`
          })
        )}">
          <div style="${escapeAttribute(style({ display: "flex", "align-items": "center", gap: "8px", "margin-bottom": "12px" }))}">
            <span style="${escapeAttribute(style({ background: theme.primary, "border-radius": "4px", width: "12px", height: "12px", display: "inline-block" }))}"></span>
            <span style="${escapeAttribute(style({ "font-size": "12px", "font-weight": 600, color: theme.muted, "text-transform": "uppercase", "letter-spacing": "0.05em" }))}">HTML Render</span>
          </div>
          <h1 style="${escapeAttribute(style({ margin: "0 0 8px 0", "font-size": "24px", "font-weight": 700, color: theme.text, "line-height": 1.3, "letter-spacing": "-0.02em" }))}">${escapeHtml(section.heading)}</h1>
          ${section.subheading
            ? renderInlineParagraphGroup(section.subheading, {
                singleStyle: style({ margin: 0, "font-size": "15px", color: theme.muted, "line-height": 1.5 }),
                multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "12px", color: theme.muted }),
                multiParagraphStyle: style({ margin: 0, "font-size": "15px", color: theme.muted, "line-height": 1.5 })
              })
            : ""}
          ${renderInlineCta(section.cta, theme)}
        </div>
      `;

    case "features":
      return `
        <div style="${escapeAttribute(sectionWrapperStyle)}">
          <div style="${escapeAttribute(style({ "margin-bottom": "16px" }))}">
            <h2 style="${escapeAttribute(sectionHeaderStyle)}">${escapeHtml(section.heading)}</h2>
            ${section.intro
              ? renderInlineParagraphGroup(section.intro, {
                  singleStyle: style({ margin: "4px 0 0", "font-size": "14px", color: theme.muted }),
                  multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "8px", "margin-top": "4px", color: theme.muted }),
                  multiParagraphStyle: style({ margin: 0, "font-size": "14px", color: theme.muted, "line-height": 1.5 })
                })
              : ""}
          </div>
          <div style="${escapeAttribute(style({ display: "grid", "grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }))}">
            ${section.items.map((item, index) => `
              <div style="${escapeAttribute(style({ padding: "16px", border: `1px solid ${theme.borderSubtle}`, "border-radius": "10px", background: theme.bg }))}">
                <div style="${escapeAttribute(style({ display: "flex", "align-items": "center", gap: "8px", "margin-bottom": "8px" }))}">
                  <span style="${escapeAttribute(style({ display: "flex", "align-items": "center", "justify-content": "center", width: "24px", height: "24px", background: theme.badgeBg, color: theme.badgeText, "border-radius": "6px", "font-size": "12px", "font-weight": 600 }))}">${index + 1}</span>
                  <h3 style="${escapeAttribute(style({ margin: 0, "font-size": "15px", "font-weight": 600, color: theme.text }))}">${escapeHtml(item.title)}</h3>
                </div>
                ${renderInlineParagraphGroup(item.body, {
                  singleStyle: style({ margin: 0, "font-size": "14px", color: theme.muted, "line-height": 1.5, "text-indent": 0 }),
                  multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "10px", color: theme.muted }),
                  multiParagraphStyle: style({ margin: 0, "font-size": "14px", color: theme.muted, "line-height": 1.5, "text-indent": 0 })
                })}
              </div>
            `).join("")}
          </div>
        </div>
      `;

    case "content":
      return `
        <div style="${escapeAttribute(sectionWrapperStyle)}">
          <h2 style="${escapeAttribute(sectionHeaderStyle)}">${escapeHtml(section.heading)}</h2>
          ${renderInlineParagraphGroup(section.body, {
            singleTag: "div",
            singleStyle: style({ margin: 0, "font-size": "14.5px", color: theme.text, "line-height": 1.7, background: theme.bg, padding: "16px", "border-radius": "10px", border: `1px solid ${theme.borderSubtle}` }),
            multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "12px", "font-size": "14.5px", color: theme.text, "line-height": 1.7, background: theme.bg, padding: "16px", "border-radius": "10px", border: `1px solid ${theme.borderSubtle}` }),
            multiParagraphStyle: style({ margin: 0, "font-size": "14.5px", color: theme.text, "line-height": 1.7 })
          })}
        </div>
      `;

    case "steps":
      return `
        <div style="${escapeAttribute(sectionWrapperStyle)}">
          <h2 style="${escapeAttribute(sectionHeaderStyle)}">${escapeHtml(section.heading)}</h2>
          <div style="${escapeAttribute(style({ display: "flex", "flex-direction": "column" }))}">
            ${section.items.map((item, index) => `
              <div style="${escapeAttribute(style({ display: "flex", gap: "16px" }))}">
                <div style="${escapeAttribute(style({ display: "flex", "flex-direction": "column", "align-items": "center" }))}">
                  <div style="${escapeAttribute(style({ width: "28px", height: "28px", "border-radius": "14px", background: theme.primarySoft, color: theme.primary, display: "flex", "align-items": "center", "justify-content": "center", "font-size": "13px", "font-weight": 600, border: `1px solid ${theme.borderSubtle}`, "flex-shrink": 0 }))}">${index + 1}</div>
                  ${index < section.items.length - 1 ? `<div style="${escapeAttribute(style({ width: "2px", height: "100%", background: theme.borderSubtle, "margin-top": "4px", "margin-bottom": "4px", "min-height": "16px" }))}"></div>` : ""}
                </div>
                <div style="${escapeAttribute(style({ "padding-bottom": index < section.items.length - 1 ? "16px" : "0", "padding-top": "2px" }))}">
                  <h3 style="${escapeAttribute(style({ margin: 0, "font-size": "15px", "font-weight": 600, color: theme.text, "line-height": 1.4 }))}">${escapeHtml(item.title)}</h3>
                  ${renderInlineParagraphGroup(item.body, {
                    singleStyle: style({ margin: "4px 0 0", "font-size": "14px", color: theme.muted, "line-height": 1.5 }),
                    multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "8px", "margin-top": "4px", color: theme.muted }),
                    multiParagraphStyle: style({ margin: 0, "font-size": "14px", color: theme.muted, "line-height": 1.5 })
                  })}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;

    case "faq":
      return `
        <div style="${escapeAttribute(sectionWrapperStyle)}">
          <h2 style="${escapeAttribute(sectionHeaderStyle)}">${escapeHtml(section.heading)}</h2>
          <div style="${escapeAttribute(style({ display: "flex", "flex-direction": "column", gap: "8px" }))}">
            ${section.items.map(item => `
              <details style="${escapeAttribute(style({ background: theme.bg, border: `1px solid ${theme.borderSubtle}`, "border-radius": "8px", padding: "12px 16px" }))}">
                <summary style="${escapeAttribute(style({ "font-size": "15px", "font-weight": 500, color: theme.text, cursor: "pointer", outline: "none", "line-height": 1.4 }))}">
                  ${escapeHtml(item.question)}
                </summary>
                ${renderInlineParagraphGroup(item.answer, {
                  singleTag: "div",
                  singleStyle: style({ "margin-top": "12px", "padding-top": "12px", "border-top": `1px dashed ${theme.border}`, "font-size": "14px", color: theme.muted, "line-height": 1.6 }),
                  multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "10px", "margin-top": "12px", "padding-top": "12px", "border-top": `1px dashed ${theme.border}`, "font-size": "14px", color: theme.muted, "line-height": 1.6 }),
                  multiParagraphStyle: style({ margin: 0, "font-size": "14px", color: theme.muted, "line-height": 1.6 })
                })}
              </details>
            `).join("")}
          </div>
        </div>
      `;
  }
}

function renderInlineFooter(footer: HtmlPageInput["footer"], theme: InlineThemeTokens): string {
  if (!footer) {
    return "";
  }

  const links = footer.links?.length
    ? `<div style="${escapeAttribute(
        style({
          display: "flex",
          "flex-wrap": "wrap",
          gap: "12px",
          "justify-content": "center",
          "margin-top": "10px"
        })
      )}">
        ${footer.links
          .map((link) => {
            const href = normalizeRenderableHref(link.href);

            if (!href) {
              return "";
            }

            return `<a href="${escapeAttribute(href)}" style="${escapeAttribute(
              style({
                color: theme.primary,
                "font-weight": 500,
                "font-size": "13px",
                "text-decoration": "none"
              })
            )}">${escapeHtml(link.label)}</a>`;
          })
          .join("")}
      </div>`
    : "";

  return `
    <div style="${escapeAttribute(
      style({
        padding: "16px 24px",
        background: theme.bg,
        "border-top": `1px solid ${theme.borderSubtle}`,
        "text-align": "center",
        "font-size": "13px",
        color: theme.muted
      })
    )}">
      ${footer.text
        ? renderInlineParagraphGroup(footer.text, {
            singleStyle: style({ margin: 0 }),
            multiWrapperStyle: style({ display: "flex", "flex-direction": "column", gap: "8px" }),
            multiParagraphStyle: style({ margin: 0 })
          })
        : ""}
      ${links}
    </div>
  `;
}

export async function renderInlineHtmlFragment(input: HtmlPageInput): Promise<string> {
  const theme = getInlineTheme(input.theme);
  const html = `
    <div data-html-render-mcp="inline" data-template="${escapeAttribute(input.template)}" style="${escapeAttribute(
      style({
        margin: "16px 0",
        background: theme.surface,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        "border-radius": "12px",
        "box-shadow": theme.shadow,
        "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
        "line-height": 1.6,
        "max-width": "100%",
        overflow: "hidden"
      })
    )}">
      ${input.sections.map((section, index) => renderInlineSection(section, theme, index === 0)).join("")}
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
        background: theme.surface,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        "border-radius": "12px",
        "box-shadow": theme.shadow,
        "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
        "line-height": 1.6,
        overflow: "hidden"
      })
    )}">
      ${renderInlineSection(section, theme, true)}
    </div>
  `;

  return formatHtml(html);
}
