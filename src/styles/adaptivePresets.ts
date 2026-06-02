import type { AdaptiveStyleProfile } from "../schemas/adaptiveThemeHtmlPageSchema.js";
import type { UpgradedContentType } from "../schemas/upgradedHtmlPageSchema.js";
import type { ResolvedAdaptiveStyleProfile } from "./adaptiveProfiles.js";

const profileByContentType: Array<{
  contentType: UpgradedContentType;
  profile: ResolvedAdaptiveStyleProfile;
}> = [
  { contentType: "news", profile: "old-newspaper" },
  { contentType: "opinion", profile: "editorial-column" },
  { contentType: "tutorial", profile: "workshop-guide" },
  { contentType: "compare", profile: "decision-brief" },
  { contentType: "research", profile: "academic-journal" },
  { contentType: "explain", profile: "clean-magazine" },
  { contentType: "list", profile: "curated-list" }
];

export function resolveAdaptiveStyleProfile(
  contentTypes: UpgradedContentType[],
  requestedProfile: AdaptiveStyleProfile
): ResolvedAdaptiveStyleProfile {
  if (requestedProfile !== "auto") {
    return requestedProfile;
  }

  for (const candidate of profileByContentType) {
    if (contentTypes.includes(candidate.contentType)) {
      return candidate.profile;
    }
  }

  return "clean-magazine";
}
