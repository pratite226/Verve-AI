const { GoogleGenAI } = require("@google/genai");
const buildBrandBriefPrompt = require("../prompts/brandBriefPrompt");
const buildContentPrompt = require("../prompts/contentPrompt");
const buildContentIdeasPrompt = require("../prompts/contentIdeasPrompt");
const buildProfileOptimizerPrompt = require("../prompts/profileOptimizerPrompt");
const buildCanvasAnalyzePrompt = require("../prompts/canvasAnalyzePrompt");
const buildRefineContentPrompt = require("../prompts/refineContentPrompt");
const buildPlannerPrompt = require("../prompts/plannerPrompt");

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

const generateContentPost = async (brief, platform, topic, pillar, tone, length) => {
  const prompt = buildContentPrompt(brief, platform, topic, pillar, tone, length);

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

const refineContentPost = async (brief, platform, content, action) => {
  const prompt = buildRefineContentPrompt(brief, platform, content, action);

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

const generateWeeklyPlan = async (brief) => {
  const prompt = buildPlannerPrompt(brief);

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });

  const rawText = response.text ? response.text.trim() : "[]";
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  try {
    const plan = JSON.parse(cleaned);
    if (!Array.isArray(plan)) {
      throw new Error("not an array");
    }
    return plan;
  } catch (error) {
    throw new Error("AI returned an unparseable weekly plan. Please try again.");
  }
};

const generateContentIdeas = async (brief, count, excludeIdeas) => {
  const prompt = buildContentIdeasPrompt(brief, count, excludeIdeas);

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
  refineContentPost,
  generateWeeklyPlan,
  generateContentIdeas,
  generateProfileOptimization,
  generateCanvasAnalysis,
};