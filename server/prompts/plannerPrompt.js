const buildPlannerPrompt = (brief) => {
  const platforms =
    brief.preferredPlatforms && brief.preferredPlatforms.length
      ? brief.preferredPlatforms.join(", ")
      : "linkedin, instagram, twitter";

  return `
You are a personal branding content strategist planning ONE week (Monday through Sunday) of posts.

Brand context:
- Positioning: ${brief.positioning}
- Tone: ${brief.tone}
- Target audience: ${brief.targetAudience}
- Content pillars: ${brief.contentPillars.join(", ")}
- Preferred platforms: ${platforms}
- Posting frequency preference: ${brief.postingFrequency || "not specified — use your judgment, roughly 3-5 posts across the week"}

Decide which days should have a post, which platform and content pillar each post supports, and a
short topic/angle for it. Not every day needs a post. Spread pillars across the week rather than
repeating one pillar every time. Only use platforms from the preferred platforms list above.

Return ONLY a JSON array, nothing else, no markdown fences. Each entry:
{ "dayOffset": 0-6 (0 = Monday, 6 = Sunday), "platform": "linkedin" | "instagram" | "twitter", "pillar": "one of the content pillars listed above", "topic": "short topic/angle, under 15 words" }
`;
};

module.exports = buildPlannerPrompt;
