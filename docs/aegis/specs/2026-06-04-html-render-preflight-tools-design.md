 # HTML Render Preflight Tools Design - 2026-06-04

 ## Goal

 Add preflight support for adaptive and information-structure HTML rendering so agents can generate a conforming page object, validate it quickly, and call the final HTML renderer only once.

 ## Problem

 The current final render tools validate only at the final call. Complex page JSON can fail late because of malformed JSON strings, wrong union members, wrong table cell types, strategy/profile drift, or Markdown-heavy body content that does not render as intended.

 ## Scope

 Add two public MCP tools:

 - `guide_html_render_page`: returns recommended target tool, structure/content type/profile/strategy choices, semantic expression order, a page skeleton, and generation rules.
 - `validate_html_render_page`: validates a draft page object for `render_adaptive_theme_html` or `render_information_structure_html`, returns errors, warnings, dry-run summary, normalized arguments, and next action.

 ## Non-goals

 - Do not generate final HTML in the preflight tools.
 - Do not replace `render_adaptive_theme_html` or `render_information_structure_html`.
 - Do not search, summarize source material, publish files, or open previews.
 - Do not mutate user content automatically.

 ## Accepted Behavior

 - Guidance defaults to `render_information_structure_html` unless the caller asks for adaptive theme output.
 - Validation accepts page objects and JSON-string page values through the same compatibility style as existing render tools.
 - Validation reports Zod schema errors with path, code, message, and fix hints.
 - Validation adds semantic warnings for structure/profile/strategy mismatches and Markdown patterns that commonly produce poor inline HTML.
 - Validation dry-runs the renderer when schema validation succeeds and reports summary fields, not full HTML.
 - A ready result tells the caller which final render tool to call once.

 ## Evidence From Current Error Samples

 The files under `error/` include a real draft where a `comparison-table` row serialized `cells` as a string that looks like an array. The validator should detect this before the final renderer is called and explain that `cells` must be an array of strings.

 ## Compatibility Boundary

 - Existing four final render tools keep their names, schemas, and behavior.
 - New tools return text content containing JSON, matching existing tool response plumbing.
 - Tool registry remains the canonical exposure point.

 ## Verification

 - Add tests for guidance output, validation success, validation errors, markdown warnings, dry-run summaries, and registry exposure.
 - Run `npm test` and `npm run check`.
