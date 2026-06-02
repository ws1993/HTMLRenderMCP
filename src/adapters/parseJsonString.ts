function stripJsonCodeFence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^```(?:json|javascript|js)?\s*([\s\S]*?)\s*```$/i);

  return match?.[1].trim() ?? trimmed;
}

function jsonErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function nextSignificantCharacter(source: string, start: number): string | undefined {
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (!/\s/.test(character)) {
      return character;
    }
  }

  return undefined;
}

function repairLikelyUnescapedStringQuotes(source: string): string {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (!inString) {
      if (character === '"') {
        inString = true;
      }

      output += character;
      continue;
    }

    if (escaped) {
      output += character;
      escaped = false;
      continue;
    }

    if (character === "\\") {
      output += character;
      escaped = true;
      continue;
    }

    if (character === '"') {
      const next = nextSignificantCharacter(source, index + 1);
      const isJsonStringTerminator = next === undefined || next === ":" || next === "," || next === "}" || next === "]";

      if (!isJsonStringTerminator) {
        output += '\\"';
        continue;
      }

      inString = false;
    }

    output += character;
  }

  return output;
}

export function parseJsonString(value: unknown, fieldName: string): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const source = stripJsonCodeFence(value);

  try {
    return JSON.parse(source);
  } catch (error) {
    const repaired = repairLikelyUnescapedStringQuotes(source);

    if (repaired !== source) {
      try {
        return JSON.parse(repaired);
      } catch {
        // Fall through to the actionable error below.
      }
    }

    throw new Error(
      `${fieldName} must be an object or a valid JSON string. Failed to parse JSON: ${jsonErrorMessage(
        error
      )}. Prefer passing ${fieldName} as a native object instead of a string. If text contains straight double quotes inside a JSON string, escape them as \\" (example: NCAA\\"疯狂三月\\"第一轮) or use Chinese quotation marks.`
    );
  }
}
