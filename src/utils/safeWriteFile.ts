import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, normalize, relative, resolve } from "node:path";

export interface SafeWriteResult {
  absolutePath: string;
  relativePath: string;
}

export async function safeWriteFile(outputPath: string, content: string): Promise<SafeWriteResult> {
  if (!outputPath || outputPath.trim().length === 0) {
    throw new Error("outputPath is required");
  }

  const normalizedOutputPath = outputPath.toLowerCase();

  if (!normalizedOutputPath.endsWith(".html") && !normalizedOutputPath.endsWith(".htm")) {
    throw new Error("outputPath must end with .html or .htm");
  }

  const root = process.cwd();
  const target = isAbsolute(outputPath) ? normalize(outputPath) : resolve(root, outputPath);
  const relativePath = relative(root, target);

  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error("outputPath must stay inside the current working directory");
  }

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");

  return {
    absolutePath: target,
    relativePath
  };
}
