import type { TextToolResponse } from "../server/toolResponse.js";

export interface HtmlRenderTool {
  name: string;
  description: string;
  inputSchema: object;
  handle(args: unknown): Promise<TextToolResponse>;
}
