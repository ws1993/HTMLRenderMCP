import assert from "node:assert/strict";
import test from "node:test";
import { renderInformationStructureInlineHtmlFragment } from "../renderers/renderInformationStructureInlineHtml.js";
import type { InformationStructureHtmlPageInput } from "../schemas/informationStructureHtmlPageSchema.js";
import { getToolByName, listToolDefinitions } from "../server/toolRegistry.js";
import { renderInformationStructureHtmlTool } from "../tools/renderInformationStructureHtmlTool.js";

const tutorialPage: InformationStructureHtmlPageInput = {
  title: "AI 工具工作流教程",
  structure: "tutorial",
  expression: {
    coreViewpoint: "完成本教程后，你将能把复杂任务拆成可验证的工具调用步骤。",
    keyTakeaways: ["成果前置", "一步一事", "检查点验收"]
  },
  expressions: [
    {
      type: "process-guide",
      title: "操作路径",
      goal: "用结构化步骤完成一次 AI 工具工作流。",
      prerequisites: ["准备输入材料", "明确最终产物"],
      steps: [
        {
          title: "拆分目标",
          body: "把用户目标拆成搜索、整理、渲染三个阶段。",
          checkpoint: "每个阶段都有可观察产物。"
        },
        {
          title: "验证输出",
          body: "检查 HTML 片段是否连续、无脚本且信息层级清晰。",
          output: "可直接粘贴到 Cherry Studio 消息区的 HTML。"
        }
      ],
      checks: ["有目标", "有步骤", "有验收"]
    }
  ]
};

test("renderInformationStructureInlineHtmlFragment maps tutorial structure to workshop style and process strategy", async () => {
  const html = await renderInformationStructureInlineHtmlFragment(tutorialPage);

  assert.match(html, /data-html-render-mcp="information-structure-inline"/);
  assert.match(html, /data-information-structure="tutorial"/);
  assert.match(html, /data-style-profile="workshop-guide"/);
  assert.match(html, /data-expression-strategy="workshop"/);
  assert.match(html, /data-expression-types="lead,key-takeaways,process-guide"/);
  assert.match(html, /data-expression-type="process-guide"/);
  assert.match(html, /操作路径/);
  assert.doesNotMatch(html, /<!doctype|<html|<body/i);
});

test("render_information_structure_html accepts top-level structure arguments", async () => {
  const response = await renderInformationStructureHtmlTool.handle({
    title: "A/B 选型简报",
    structure: "compare",
    expression: {
      coreViewpoint: "如果目标是更快上线，优先选择方案 A；如果目标是长期扩展，选择方案 B。"
    },
    expressions: [
      {
        type: "decision-matrix",
        title: "方案对比",
        recommendation: "短期选择方案 A，保留 B 的演进路径。",
        criteria: ["上线速度", "维护成本", "扩展性"],
        options: [
          { name: "方案 A", verdict: "recommended", scores: ["高", "中", "中"], rationale: "实现成本最低。" },
          { name: "方案 B", verdict: "acceptable", scores: ["中", "高", "高"], rationale: "长期能力更强。" }
        ]
      }
    ]
  });

  const html = response.content[0]?.text ?? "";

  assert.equal(response.isError, undefined);
  assert.match(html, /data-information-structure="compare"/);
  assert.match(html, /data-style-profile="decision-brief"/);
  assert.match(html, /data-expression-strategy="decision"/);
  assert.match(html, /方案对比/);
});

test("render_information_structure_html is registered and render_wechat_html is removed", () => {
  const definitions = listToolDefinitions();
  const newDefinition = definitions.find((tool) => tool.name === "render_information_structure_html");

  assert.ok(newDefinition);
  assert.match(newDefinition.description, /information structure/i);
  assert.match(JSON.stringify(newDefinition.inputSchema), /structure/);
  assert.equal(getToolByName("render_information_structure_html"), renderInformationStructureHtmlTool);
  assert.equal(getToolByName("render_wechat_html"), undefined);
  assert.equal(definitions.some((tool) => tool.name === "render_wechat_html"), false);
});
