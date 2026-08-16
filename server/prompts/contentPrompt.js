const LENGTH_GUIDANCE = {
  short: "Keep it short — roughly 40-80 words (or well under 280 characters for Twitter).",
  medium: "Aim for a medium length — roughly 150-250 words (or near the 280-character limit for Twitter).",
  long: "Go long and detailed — roughly 300-400 words (Twitter: write a short thread of 3-5 tweets separated by blank lines).",
};

const buildContentPrompt = (brief, platform, topic, pillar, tone, length) => {
  return `
You are a personal branding content writer. Write ONE ${platform} post.

Brand context (stay consistent with this):
- Positioning: ${brief.positioning}
- Tone: ${tone || brief.tone}
- Target audience: ${brief.targetAudience}
${brief.differentiator ? `- What makes them different: ${brief.differentiator}` : ""}
${pillar ? `- This post should specifically support the content pillar: "${pillar}"` : ""}
${brief.thingsToAvoid ? `- Hard constraint, never violate: avoid ${brief.thingsToAvoid}` : ""}

Topic for this post: ${topic}

Platform-specific rules:
${platform === "linkedin" ? "- Professional but personable, no hashtag spam (max 3 hashtags at the end)." : ""}
${platform === "instagram" ? "- Conversational, punchy, short paragraphs, can use emojis sparingly, 5-8 relevant hashtags at the end." : ""}
${platform === "twitter" ? "- Concise, no hashtag spam." : ""}

Length: ${LENGTH_GUIDANCE[length] || LENGTH_GUIDANCE.medium}

Return ONLY the post text. No preamble, no explanation, no markdown formatting, no quotes around it.
`;
};

module.exports = buildContentPrompt;