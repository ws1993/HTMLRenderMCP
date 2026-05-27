import { escapeHtml } from "./escapeHtml.js";

const inlineFormattingTags = [
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "code",
  "mark",
  "small",
  "sub",
  "sup"
] as const;

const inlineFormattingTagPattern = inlineFormattingTags.join("|");
const rawFormattingTagPattern = `<\\s*/?\\s*(?:${inlineFormattingTagPattern})\\s*>`;
const rawBrTagPattern = "<\\s*br\\s*/?\\s*>";
const rawAllowedTagPattern = `(?:${rawFormattingTagPattern}|${rawBrTagPattern})`;
const markdownCodeWrappedAllowedTagsPattern = new RegExp(
  "`\\s*(" + rawAllowedTagPattern + "(?:\\s*" + rawAllowedTagPattern + ")*)\\s*`",
  "gi"
);
const escapedFormattingTagPattern = new RegExp(
  `&lt;\\s*(/?)\\s*(${inlineFormattingTagPattern})\\s*&gt;`,
  "gi"
);
const escapedBrTagPattern = /&lt;\s*br\s*\/?\s*&gt;/gi;

function normalizeAllowedInlineTags(value: string): string {
  return value.replace(markdownCodeWrappedAllowedTagsPattern, "$1");
}

/**
 * Renders user-supplied rich text while only allowing a very small inline HTML subset.
 * Everything else is HTML-escaped, so attributes/scripts cannot be injected.
 */
export function renderInlineRichText(value: unknown): string {
  const escaped = escapeHtml(normalizeAllowedInlineTags(String(value ?? "")));

  return escaped
    .replace(escapedBrTagPattern, "<br>")
    .replace(escapedFormattingTagPattern, (_match, slash: string, tag: string) => {
      return `<${slash}${tag.toLowerCase()}>`;
    })
    .replace(/\r\n|\r|\n/g, "<br>");
}
