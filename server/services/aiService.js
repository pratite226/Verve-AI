const { GoogleGenAI } = require("@google/genai");
const buildBrandBriefPrompt = require("../prompts/brandBriefPrompt");
const buildContentPrompt = require("../prompts/contentPrompt");
const buildContentIdeasPrompt = require("../prompts/contentIdeasPrompt");
const buildProfileOptimizerPrompt = require("../prompts/profileOptimizerPrompt");
const buildCanvasAnalyzePrompt = require("../prompts/canvasAnalyzePrompt");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateBrandBrief = async (answers) => {
  const prompt = buildBrandBriefPrompt(answers);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });

  const rawText = response.text ? response.text.trim() : "{}";
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error("AI returned an unparseable Brand Brief. Please try again.");
  }
};

const generateContentPost = async (brief, platform, topic, pillar) => {
  const prompt = buildContentPrompt(brief, platform, topic, pillar);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });

  const rawText = response.text ? response.text.trim() : "";

  if (!rawText) {
    throw new Error("AI returned an empty post. Please try again.");
  }

  return rawText;
};

const generateContentIdeas = async (brief, count) => {
  const prompt = buildContentIdeasPrompt(brief, count);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });

  const rawText = response.text ? response.text.trim() : "[]";
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  try {
    const ideas = JSON.parse(cleaned);
    if (!Array.isArray(ideas)) {
      throw new Error("not an array");
    }
    return ideas;
  } catch (error) {
    throw new Error("AI returned unparseable content ideas. Please try again.");
  }
};

const generateProfileOptimization = async (brief, currentHeadline, currentAbout) => {
  const prompt = buildProfileOptimizerPrompt(brief, currentHeadline, currentAbout);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });

  const rawText = response.text ? response.text.trim() : "{}";
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error("AI returned an unparseable profile optimization. Please try again.");
  }
};

const generateCanvasAnalysis = async (brief, textNotes) => {
  const prompt = buildCanvasAnalyzePrompt(brief, textNotes);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });

  const rawText = response.text ? response.text.trim() : "{}";
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error("AI returned an unparseable board analysis. Please try again.");
  }
};

module.exports = {
  generateBrandBrief,
  generateContentPost,
  generateContentIdeas,
  generateProfileOptimization,
  generateCanvasAnalysis,
};