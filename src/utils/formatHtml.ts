import prettier from "prettier";

export async function formatHtml(html: string): Promise<string> {
  return prettier.format(html, {
    parser: "html",
    printWidth: 100,
    proseWrap: "preserve"
  });
}
