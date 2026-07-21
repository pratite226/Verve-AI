const buildContentPrompt = (brief, platform, topic, pillar) => {
  return `
You are a personal branding content writer. Write ONE ${platform} post.

Brand context (stay consistent with this):
- Positioning: ${brief.positioning}
- Tone: ${brief.tone}
- Target audience: ${brief.targetAudience}
${pillar ? `- This post should specifically support the content pillar: "${pillar}"` : ""}

Topic for this post: ${topic}

Platform-specific rules:
${platform === "linkedin" ? "- Professional but personable, 150-250 words, no hashtag spam (max 3 hashtags at the end)." : ""}
${platform === "instagram" ? "- Conversational, punchy, short paragraphs, can use emojis sparingly, 5-8 relevant hashtags at the end." : ""}
${platform === "twitter" ? "- Concise, under 280 characters, no hashtag spam." : ""}

Return ONLY the post text. No preamble, no explanation, no markdown formatting, no quotes around it.
`;
};

module.exports = buildContentPrompt;