import { parseJsonString } from "./parseJsonString.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeRenderFinalHtmlArguments(value: unknown): unknown {
  const args = parseJsonString(value, "arguments");

  if (!isRecord(args)) {
    return args;
  }

  const unwrappedArgs = isRecord(args.params) && !("page" in args) ? args.params : args;

  if ("page" in unwrappedArgs) {
    return {
      ...unwrappedArgs,
      page: parseJsonString(unwrappedArgs.page, "page")
    };
  }

  if ("title" in unwrappedArgs && "sections" in unwrappedArgs) {
    return {
      page: unwrappedArgs
    };
  }

  return unwrappedArgs;
}

export function normalizeRenderUpgradedHtmlArguments(value: unknown): unknown {
  const args = parseJsonString(value, "arguments");

  if (!isRecord(args)) {
    return args;
  }

  const unwrappedArgs = isRecord(args.params) && !("page" in args) ? args.params : args;

  if ("page" in unwrappedArgs) {
    return {
      ...unwrappedArgs,
      page: parseJsonString(unwrappedArgs.page, "page")
    };
  }

  if ("title" in unwrappedArgs && "blocks" in unwrappedArgs) {
    return {
      page: unwrappedArgs
    };
  }

  return unwrappedArgs;
}

export function normalizeRenderAdaptiveThemeHtmlArguments(value: unknown): unknown {
  const args = parseJsonString(value, "arguments");

  if (!isRecord(args)) {
    return args;
  }

  const unwrappedArgs = isRecord(args.params) && !("page" in args) ? args.params : args;

  if ("page" in unwrappedArgs) {
    return {
      ...unwrappedArgs,
      page: parseJsonString(unwrappedArgs.page, "page")
    };
  }

  if ("title" in unwrappedArgs && ("blocks" in unwrappedArgs || "expressions" in unwrappedArgs || "expression" in unwrappedArgs)) {
    return {
      page: unwrappedArgs
    };
  }

  return unwrappedArgs;
}

export function normalizeRenderInformationStructureHtmlArguments(value: unknown): unknown {
  const args = parseJsonString(value, "arguments");

  if (!isRecord(args)) {
    return args;
  }

  const unwrappedArgs = isRecord(args.params) && !("page" in args) ? args.params : args;

  if ("page" in unwrappedArgs) {
    return {
      ...unwrappedArgs,
      page: parseJsonString(unwrappedArgs.page, "page")
    };
  }

  if (
    "title" in unwrappedArgs &&
    ("structure" in unwrappedArgs || "contentTypes" in unwrappedArgs || "blocks" in unwrappedArgs || "expressions" in unwrappedArgs || "expression" in unwrappedArgs)
  ) {
    return {
      page: unwrappedArgs
    };
  }

  return unwrappedArgs;
}
