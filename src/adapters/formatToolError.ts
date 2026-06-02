import { z } from "zod";

export function formatToolError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return JSON.stringify(z.treeifyError(error), null, 2);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
