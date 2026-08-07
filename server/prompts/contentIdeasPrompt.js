const buildContentIdeasPrompt = (brief, count = 8) => {
  return `
You are a personal branding content strategist. Generate ${count} content post ideas
for this person, based on their brand context below.

Brand context:
- Positioning: ${brief.positioning}
- Target audience: ${brief.targetAudience}
- Tone: ${brief.tone}
- Content pillars: ${brief.contentPillars.join(", ")}
${brief.topicsLoved && brief.topicsLoved.length ? `- Topics they especially love talking about: ${brief.topicsLoved.join(", ")}` : ""}
${brief.thingsToAvoid ? `- Never suggest ideas involving: ${brief.thingsToAvoid}` : ""}

Rules:
- Each idea should be a single short line (under 15 words) — a topic or angle, NOT a full post
- Ideas should be spread across the content pillars listed above, not just one
- Favor angles that connect to the topics they love, where it fits naturally
- Mix formats where relevant: personal story, industry tip, opinion, case study, question to audience
- Do not repeat similar ideas

Return ONLY a JSON array of strings, nothing else, no markdown fences. Example shape:
["idea one", "idea two", "idea three"]
`;
};

module.exports = buildContentIdeasPrompt;