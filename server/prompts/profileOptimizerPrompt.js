const buildProfileOptimizerPrompt = (brief, currentHeadline, currentAbout) => {
  return `
You are a LinkedIn profile optimization expert. Rewrite this person's LinkedIn
headline and About section to be stronger, using their brand context below.

Brand context:
- Positioning: ${brief.positioning}
- Tagline: ${brief.tagline}
- Tone: ${brief.tone}
- Target audience: ${brief.targetAudience}
- Mission: ${brief.mission}

Current headline: ${currentHeadline || "(none provided)"}
Current About section: ${currentAbout || "(none provided)"}

Rules:
- Headline: under 220 characters (LinkedIn's limit), specific, benefit-oriented, not generic buzzwords like "passionate" or "results-driven"
- About section: 3-4 short paragraphs, written in first person, opens with a hook (not "I am a..."), showcases expertise, ends with what they're looking for or open to
- Keep it consistent with the tone and positioning above
- Do not invent achievements or facts not implied by the brand context or current text provided

Return ONLY a JSON object in exactly this shape, no markdown fences, no extra text:
{
  "optimizedHeadline": "...",
  "optimizedAbout": "...",
  "changesSummary": "one sentence explaining the key improvement made"
}
`;
};

module.exports = buildProfileOptimizerPrompt;