
export async function formatHtml(html: string): Promise<string> {
  // Return a minified, single-line HTML string.
  // This prevents Markdown parsers from treating whitespace and newlines 
  // as indented code blocks or unwanted paragraph breaks.
  return html
    .split("\n")
    .map((line) => line.trim())
    .join("");
}
