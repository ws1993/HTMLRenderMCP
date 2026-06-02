import { formatToolError } from "../adapters/formatToolError.js";

export interface TextToolResponse {
  [key: string]: unknown;
  isError?: boolean;
  content: Array<{ type: "text"; text: string }>;
}

export function textContent(value: unknown): TextToolResponse {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
    ]
  };
}

export function errorContent(error: unknown): TextToolResponse {
  return {
    isError: true,
    content: [{ type: "text", text: formatToolError(error) }]
  };
}
