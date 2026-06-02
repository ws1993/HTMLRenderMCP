import { renderAdaptiveThemeHtmlTool } from "../tools/renderAdaptiveThemeHtmlTool.js";
import { renderFinalHtmlTool } from "../tools/renderFinalHtmlTool.js";
import { renderInformationStructureHtmlTool } from "../tools/renderInformationStructureHtmlTool.js";
import { renderUpgradedHtmlTool } from "../tools/renderUpgradedHtmlTool.js";
import type { HtmlRenderTool } from "../tools/types.js";

const disabledToolsMessage =
  "This MCP server exposes render_final_html, render_upgraded_html, render_adaptive_theme_html, and render_information_structure_html for one-shot Cherry Studio HTML output.";

export const htmlRenderTools: HtmlRenderTool[] = [
  renderFinalHtmlTool,
  renderUpgradedHtmlTool,
  renderAdaptiveThemeHtmlTool,
  renderInformationStructureHtmlTool
];

export function listToolDefinitions(): Array<Pick<HtmlRenderTool, "name" | "description" | "inputSchema">> {
  return htmlRenderTools.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema
  }));
}

export function getToolByName(name: string): HtmlRenderTool | undefined {
  return htmlRenderTools.find((tool) => tool.name === name);
}

export function createDisabledToolError(name: string): Error {
  return new Error(`Tool ${name} is disabled. ${disabledToolsMessage}`);
}
