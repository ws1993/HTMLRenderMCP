 # Initial Baseline Snapshot - 2026-06-04

 ## Project Context

 HTML Render MCP is a local MCP server for Cherry Studio. It exposes final one-shot HTML render tools that turn structured page data into continuous inline-styled HTML fragments.

 ## Current Authority

 - `README.md` describes public MCP tools, usage prompts, and accepted page structures.
 - `docs/architecture.md` defines the separation between server plumbing, tools, schemas, renderers, styles, adapters, and tests.
 - `src/server/toolRegistry.ts` is the canonical registry for exposed MCP tools.
 - `src/tools/*` owns one handler per exposed tool.
 - `src/toolSchemas/*` owns MCP JSON schema declarations.
 - `src/schemas/*` owns typed runtime validation contracts.

 ## Relevant Constraint

 Existing final render tools should remain one-shot final HTML producers. Preflight guidance or validation should not return final HTML and should not replace the final render call.
