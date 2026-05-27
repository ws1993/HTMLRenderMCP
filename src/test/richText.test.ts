import assert from "node:assert/strict";
import test from "node:test";
import { renderHtmlPage } from "../renderers/renderHtml.js";
import { renderInlineHtmlFragment } from "../renderers/renderInlineHtml.js";
import type { HtmlPageInput } from "../schemas/htmlPageSchema.js";
import {
  renderInlineRichText,
  renderInlineRichTextParagraphs
} from "../utils/renderInlineRichText.js";

const samplePage: HtmlPageInput = {
  template: "article",
  title: "文本渲染回归",
  lang: "zh-CN",
  theme: "modern-blue",
  sections: [
    {
      type: "features",
      heading: "模型评价",
      items: [
        {
          title: "Gemma 4",
          body: "Gemma 4 在思考深度给满时可以跟彼时的 Claude Sonnet 掰手腕。\n写作场景推荐用 Gemini 2.5 Pro。"
        },
        {
          title: "Claude Sonnet 4.6",
          body: "    听得懂人话，提问能促使你深入思考。\n    缺点是文字本体风格过于浓烈。"
        }
      ]
    },
    {
      type: "content",
      heading: "正文",
      body: "第一段。\n\n第二段。"
    },
    {
      type: "faq",
      heading: "常见问题",
      items: [
        {
          question: "会保留显式换行吗？",
          answer: "第一行<br>第二行"
        }
      ]
    }
  ],
  footer: {
    text: "页脚第一行\n\n页脚第二行"
  }
};

test("renderInlineRichText merges soft line breaks into inline text", () => {
  assert.equal(
    renderInlineRichText("第一句。\n第二句。"),
    "第一句。 第二句。"
  );
});

test("renderInlineRichText creates paragraph blocks only for blank-line breaks", () => {
  assert.equal(
    renderInlineRichText("第一段。\n\n第二段。"),
    "<p>第一段。</p><p>第二段。</p>"
  );
});

test("renderInlineRichText preserves explicit br tags", () => {
  assert.equal(
    renderInlineRichText("第一行<br />第二行"),
    "第一行<br>第二行"
  );
});

test("renderInlineRichTextParagraphs trims indentation on each line", () => {
  assert.deepEqual(renderInlineRichTextParagraphs("    第一行。\n\t第二行。"), [
    "第一行。 第二行。"
  ]);
});

test("renderHtmlPage uses shared paragraph-aware rendering without nested p tags", async () => {
  const html = await renderHtmlPage(samplePage);

  assert.match(html, /Gemma 4 在思考深度给满时可以跟彼时的 Claude Sonnet 掰手腕。\s+写作场景推荐用 Gemini 2\.5\s+Pro。/);
  assert.doesNotMatch(html, /Gemma 4 在思考深度给满时可以跟彼时的 Claude Sonnet 掰手腕。<br>/);
  assert.match(html, /<div class="rich-text-group rich-text-panel">\s*<p>第一段。<\/p>\s*<p>第二段。<\/p>\s*<\/div>/);
  assert.doesNotMatch(html, /<p>\s*<p>/);
});

test("renderInlineHtmlFragment keeps the same paragraph semantics as full-page renderer", async () => {
  const html = await renderInlineHtmlFragment(samplePage);

  assert.match(html, /Gemma 4 在思考深度给满时可以跟彼时的 Claude Sonnet 掰手腕。\s+写作场景推荐用 Gemini 2\.5\s+Pro。/);
  assert.match(html, /第一行<br\s*\/?>第二行/);
  assert.match(
    html,
    /<div[^>]*>\s*<p[^>]*>\s*第一段。\s*<\/p>\s*<p[^>]*>\s*第二段。\s*<\/p>\s*<\/div>/
  );
  assert.doesNotMatch(html, /听得懂人话，提问能促使你深入思考。<\/p>\s*<p/);
});
