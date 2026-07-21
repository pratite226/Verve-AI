const buildBrandBriefPrompt = (answers) => {
  return `
You are a senior personal branding strategist. Based on the intake answers below,
produce a JSON object only — no preamble, no markdown fences, no extra text.

Intake answers:
- What they do: ${answers.whatTheyDo}
- Industry: ${answers.industry}
- Career stage: ${answers.careerStage}
- Target audience: ${answers.audience}
- Goal: ${answers.goal}
- Personality / tone preference: ${answers.personality}
- Achievements: ${answers.achievements}

Return exactly this JSON shape and nothing else:
{
  "positioning": "one or two sentence positioning statement",
  "tagline": "a short, memorable personal tagline (under 10 words)",
  "tone": "3-5 words describing voice and tone",
  "targetAudience": "one sentence describing the target audience",
  "mission": "1-2 sentence mission statement",
  "contentPillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4"]
}
`;
};

module.exports = buildBrandBriefPrompt;