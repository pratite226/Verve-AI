const ACTION_INSTRUCTIONS = {
  improve: "Improve this post overall — tighten the writing, sharpen the hook, and make it more compelling, while keeping the same core message.",
  shorten: "Make this post noticeably shorter and punchier, cutting anything non-essential, while keeping the core message.",
  more_engaging: "Rewrite this post to be more engaging — add a stronger hook, more energy, and a clearer takeaway.",
  more_professional: "Rewrite this post in a more professional, polished tone.",
  more_casual: "Rewrite this post in a more casual, conversational tone, like talking to a friend.",
  add_hook: "Rewrite this post with a much stronger opening hook in the first line, keeping the rest of the message intact.",
  add_cta: "Rewrite this post to end with a clear, natural call-to-action inviting engagement (a question, an invite to comment/share, etc.).",
  add_storytelling: "Rewrite this post to lead with a short personal story or anecdote that illustrates the point, before getting to the insight.",
};

const buildRefineContentPrompt = (brief, platform, content, action) => {
  const instruction = ACTION_INSTRUCTIONS[action] || ACTION_INSTRUCTIONS.improve;

  return `
You are a personal branding content editor. Rewrite the ${platform} post below.

Brand context (stay consistent with this):
- Positioning: ${brief.positioning}
- Tone: ${brief.tone}
- Target audience: ${brief.targetAudience}
${brief.thingsToAvoid ? `- Hard constraint, never violate: avoid ${brief.thingsToAvoid}` : ""}

Instruction: ${instruction}

Original post:
"""
${content}
"""

Return ONLY the rewritten post text. No preamble, no explanation, no markdown formatting, no quotes around it.
`;
};

module.exports = buildRefineContentPrompt;
