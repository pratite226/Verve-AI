const buildCanvasAnalyzePrompt = (brief, textNotes) => {
  return `
You are a personal branding content strategist. A user has pinned scattered notes
and ideas to a brainstorming board. Look at what they've collected and tell them
what content they could make from it.

Brand context:
- Positioning: ${brief.positioning}
- Content pillars: ${brief.contentPillars.join(", ")}
${brief.thingsToAvoid ? `- Never suggest ideas involving: ${brief.thingsToAvoid}` : ""}

Notes on the board:
${textNotes.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Rules:
- Identify 2-4 concrete post ideas that could be made from combining or expanding on these notes
- Each suggestion should reference which note(s) it draws from
- Be specific, not generic — reference actual content from the notes above
- If the notes don't have enough material for a post, say so honestly instead of forcing an idea

Return ONLY a JSON object in exactly this shape, no markdown fences, no extra text:
{
  "summary": "one sentence overview of what's on the board",
  "suggestions": [
    { "idea": "specific post idea", "basedOn": "which note(s) this draws from" }
  ]
}
`;
};

module.exports = buildCanvasAnalyzePrompt;