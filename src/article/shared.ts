import type { ArticleDiagnostic } from "../schemas/articleHtmlGenerationSchema.js";

export function articleDiagnostic(
  path: string,
  code: string,
  message: string,
  fix: string,
  severity: ArticleDiagnostic["severity"] = "error"
): ArticleDiagnostic {
  return { path, code, message, fix, severity };
}

export function hasBlockingDiagnostics(diagnostics: ArticleDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}
