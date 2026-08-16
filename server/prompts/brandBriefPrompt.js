const buildBrandBriefPrompt = (answers) => {
  return `
You are a senior personal branding strategist. Based on the intake answers below,
produce a JSON object only — no preamble, no markdown fences, no extra text.

Intake answers:
- What they do: ${answers.whatTheyDo}
- Industry: ${answers.industry}
- Career stage: ${answers.careerStage}
- Age range: ${answers.ageRange || "not provided"}
- Gender: ${answers.gender || "not provided"}
- Interests: ${answers.interests || "not provided"}
- Target audience: ${answers.audience}
- Goal: ${answers.goal}
- Personality / tone preference: ${answers.personality}
- Achievements: ${answers.achievements}
- Topics they love talking about: ${answers.topicsLoved || "not provided"}
- Things to avoid (tone or topics): ${answers.thingsToAvoid || "not provided"}
- People/brands whose voice they admire: ${answers.inspirations || "not provided"}
- Biggest challenge right now: ${answers.biggestChallenge || "not provided"}
- Who they are NOT for: ${answers.notFor || "not provided"}
- What makes them different from peers: ${answers.differentiator || "not provided"}

Use the differentiator and "who they are NOT for" answers to sharpen the positioning statement so it
is specific rather than generic. Let their interests and topics they love talking about inform the
content pillars. Respect anything listed under "things to avoid" — never contradict it in the tone
or positioning you produce.

Return exactly this JSON shape and nothing else:
{
  "positioning": "one or two sentence positioning statement",
  "tagline": "a short, memorable personal tagline (under 10 words)",
  "tone": "3-5 words describing voice and tone",
  "targetAudience": "one sentence describing the target audience",
  "mission": "1-2 sentence mission statement",
  "contentPillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4"],
  "pillarWeights": { "pillar 1": 40, "pillar 2": 30, "pillar 3": 20, "pillar 4": 10 }
}

"pillarWeights" must have exactly one integer percentage per pillar in "contentPillars" (same
names), weighted by how much they should be talked about, and the percentages must sum to 100.
`;
};

module.exports = buildBrandBriefPrompt;