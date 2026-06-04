 import { availableAdaptiveStyleProfiles, availableAdaptiveExpressionStrategies } from "../schemas/adaptiveThemeHtmlPageSchema.js";
 import { availableInformationStructures } from "../schemas/informationStructureHtmlPageSchema.js";
 import { availableUpgradedContentTypes } from "../schemas/upgradedHtmlPageSchema.js";
 import { availablePreflightTargetTools } from "../preflight/htmlRenderPreflight.js";

 export const htmlRenderGuidanceInputSchema = {
   type: "object",
   properties: {
     targetTool: {
       type: "string",
       enum: availablePreflightTargetTools,
       default: "render_information_structure_html",
       description: "Final render tool to prepare for. Defaults to render_information_structure_html."
     },
     title: {
       type: "string",
       description: "Optional final page title to place into the returned page skeleton."
     },
     description: {
       type: "string",
       description: "Optional final page description to place into the returned page skeleton."
     },
     structure: {
       type: "string",
       enum: availableInformationStructures,
       default: "auto",
       description: "Preferred information structure when preparing for render_information_structure_html."
     },
     contentTypes: {
       type: "array",
       minItems: 1,
       items: { type: "string", enum: availableUpgradedContentTypes },
       description: "Optional content-type hints used to recommend structure and visual strategy."
     },
     styleProfile: {
       type: "string",
       enum: availableAdaptiveStyleProfiles,
       default: "auto",
       description: "Optional style hint. Guidance recommends auto unless there is a deliberate override."
     },
     expressionStrategy: {
       type: "string",
       enum: availableAdaptiveExpressionStrategies,
       default: "auto",
       description: "Optional expression strategy hint. Guidance recommends auto unless there is a deliberate override."
     }
   }
 } as const;
