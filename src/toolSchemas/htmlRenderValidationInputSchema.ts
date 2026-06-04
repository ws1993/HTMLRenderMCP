 import { availablePreflightTargetTools } from "../preflight/htmlRenderPreflight.js";

 export const htmlRenderValidationInputSchema = {
   type: "object",
   required: ["page"],
   properties: {
     targetTool: {
       type: "string",
       enum: availablePreflightTargetTools,
       default: "render_information_structure_html",
       description: "Final render tool that the page will be passed to after validation."
     },
     page: {
       anyOf: [{ type: "object" }, { type: "string" }],
       description: "Draft page object or JSON string to validate before final rendering. Prefer a native object."
     },
     mode: {
       type: "string",
       enum: ["draft", "final"],
       default: "final",
       description: "Validation strictness hint. Current behavior reports schema errors as blocking and quality issues as warnings."
     },
     dryRun: {
       type: "boolean",
       default: true,
       description: "When true, render internally after schema validation and return only a summary, never final HTML."
     }
   }
 } as const;
