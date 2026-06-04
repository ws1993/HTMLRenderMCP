# HTML Render MCP Architecture

This project is structured around small, style-specific modules so rendering logic, MCP tool plumbing, schema validation, and visual themes can evolve independently.

## Goals

- Keep startup, MCP server wiring, tool handlers, schemas, renderers, and style definitions separated.
- Keep each visual style family maintainable through its own style package and renderer package.
- Make future additions explicit: new tools, new renderers, new blocks, and new style profiles should have a clear home.
- Preserve compatibility for existing imports while encouraging new code to use package entrypoints.

## Top-level flow

```txt
src/index.ts
  -> src/server/createMcpServer.ts
    -> src/tools/*
      -> src/preflight/*
      -> src/renderers/*
        -> src/renderers/{shared,upgraded,adaptive,informationStructure}/*
        -> src/styles/{basic,upgraded,adaptive}/index.ts
```

### Entry point

- `src/index.ts` only creates the MCP server and connects the stdio transport.
- It should not contain tool definitions, schemas, renderer logic, or style logic.

### Server and tools

- `src/server/createMcpServer.ts` owns MCP server setup, tool listing, and tool dispatch.
- `src/tools/*` contains one handler per tool.
- `src/toolSchemas/*` contains MCP JSON schema declarations.
- `src/adapters/*` contains compatibility and input-shaping helpers such as JSON string parsing.
- `src/preflight/*` contains guidance and validation logic for non-final pre-render checks.

### Schemas

- `src/schemas/*` defines typed input contracts for renderers and tools.
- Schema modules should not import renderer or tool implementation details.

### Preflight

- `src/preflight/htmlRenderPreflight.ts` owns guidance, semantic readiness checks, schema diagnostic shaping, and dry-run summaries for render preflight tools.
- Preflight modules may import schemas and renderer facades to validate renderability, but must not return final HTML.
- Tool handlers should keep only MCP plumbing and delegate preflight behavior to this package.

## Renderer layout

```txt
src/renderers/
  renderHtml.ts                    # legacy/full-page renderer facade
  renderInlineHtml.ts              # basic inline renderer
  renderUpgradedInlineHtml.ts      # upgraded inline facade
  renderAdaptiveThemeInlineHtml.ts # adaptive theme facade
  renderInformationStructureInlineHtml.ts # information structure facade
  shared/
    paragraph.ts                   # shared paragraph/rich-text grouping
    style.ts                       # shared inline style serialization
  upgraded/
    blocks.ts                      # upgraded block renderer dispatch
    footer.ts                      # upgraded footer renderer
    renderHelpers.ts               # upgraded presentation helpers
  adaptive/
    adaptiveContext.ts             # adaptive profile/theme/strategy resolution
    blocks.ts                      # adaptive block rendering and fallback
    expressions.ts                 # adaptive semantic expression renderers
    expressionResolution.ts        # generated/explicit expression selection
    renderHelpers.ts               # adaptive presentation helpers
  informationStructure/
    structureResolution.ts         # structure -> content type / strategy resolution
```

### Renderer facade rule

Facade files should orchestrate only:

- Resolve theme/context.
- Render top-level wrapper attributes and styles.
- Delegate block/expression/footer rendering to style-specific modules.
- Format final HTML.

Renderer facades should not grow large switch statements or style token tables.

### Shared renderer utilities

- Use `src/renderers/shared/style.ts` for inline style serialization.
- Use `src/renderers/shared/paragraph.ts` for rich-text paragraph grouping.
- Put shared helpers here only when they are style-agnostic.

## Style package layout

New renderer code should import style APIs from package entrypoints:

```txt
src/styles/
  basic/
    index.ts
    themes.ts
  upgraded/
    index.ts
    themes.ts
  adaptive/
    index.ts
    profiles.ts
    presets.ts
```

Current compatibility modules at the top of `src/styles` are kept so older import paths can continue to work during refactors. New code should prefer:

- `../styles/basic/index.js`
- `../styles/upgraded/index.js`
- `../styles/adaptive/index.js`

### Style package responsibilities

#### Basic

- Provides `InlineThemeTokens`.
- Resolves simple fixed themes for the basic inline renderer.

#### Upgraded

- Provides `UpgradedInlineThemeTokens`.
- Resolves theme tokens plus user-provided design token overrides.
- Owns upgraded-specific spacing, radius, typography, border, and shadow tokens.

#### Adaptive

- Provides `AdaptiveInlineThemeTokens` and adaptive profile definitions.
- Maps content types to style profiles.
- Resolves expression strategy from profile defaults and user hints.
- Owns semantic profile presets such as newspaper, academic, decision brief, workshop guide, curated list, and editorial column.

#### Information Structure

- Reuses adaptive theme tokens and semantic expression renderers.
- Owns explicit structure resolution for `news`, `research`, `explain`, `compare`, `tutorial`, `list`, and `opinion`.
- Maps each structure to a content type and expression strategy before delegating rendering to adaptive components.
- Does not own Markdown parsing, image generation, external publishing, or style token tables.

## Extension guide

### Add a new MCP tool

1. Add or update input schema in `src/schemas/*`.
2. Add MCP schema declaration in `src/toolSchemas/*`.
3. Add a handler in `src/tools/*`.
4. Register the handler/schema in `src/server/createMcpServer.ts`.
5. Add focused tests if behavior changes.

### Add a new upgraded block type

1. Extend `UpgradedHtmlBlockInput` in `src/schemas/upgradedHtmlPageSchema.ts`.
2. Add rendering logic in `src/renderers/upgraded/blocks.ts` or split into a dedicated block module if it grows.
3. Reuse helpers from `src/renderers/upgraded/renderHelpers.ts`.
4. Add fallback/adaptive behavior in `src/renderers/adaptive/blocks.ts` if the adaptive renderer should support it specially.
5. Add a focused rendering test for escaping, paragraph behavior, and layout attributes.

### Add a new upgraded theme preset

1. Add the base theme tokens in the upgraded style package.
2. Keep token override behavior centralized in the upgraded style resolver.
3. Avoid embedding theme-specific constants in renderer modules.

### Add a new adaptive style profile

1. Add the profile to the adaptive schema type.
2. Add `AdaptiveInlineThemeTokens` in the adaptive style package.
3. Add `AdaptiveProfileDefinition` strategy defaults.
4. Optionally map one or more content types in adaptive presets.
5. Add or update tests that verify profile selection and rendered metadata.

### Add a new adaptive expression type

1. Extend the adaptive expression schema.
2. Add renderer logic in `src/renderers/adaptive/expressions.ts`.
3. Update expression resolution only if the expression can be generated from config.
4. Add a focused rendering test.

### Add or adjust an information structure

1. Extend `informationStructureSchema` in `src/schemas/informationStructureHtmlPageSchema.ts`.
2. Map the structure to a default expression strategy in the same schema module.
3. Update `src/renderers/informationStructure/structureResolution.ts` if auto-selection priority or content type mapping changes.
4. Prefer reusing adaptive expressions and style profiles before adding new renderers.
5. Add focused tests that verify rendered metadata, strategy selection, and registry/tool schema exposure.

## Design constraints

- Rendering modules must escape HTML and attributes through shared utilities.
- URL output must go through `normalizeRenderableHref` before rendering links.
- Avoid nested paragraphs by using `renderParagraphGroup` for user-provided text.
- Avoid mixing theme token definitions with markup generation.
- Prefer importing style APIs through package entrypoints rather than concrete legacy files.
- Keep compatibility exports only as thin boundaries; do not add new behavior to compatibility files.

## Verification

Run these checks after structural changes:

```txt
npm run check
npm test
```

The typecheck catches broken package entrypoints and import paths. The test suite catches paragraph rendering, escaping, upgraded rendering, and adaptive profile behavior.
