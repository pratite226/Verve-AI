const ContentDraft = require("../models/ContentDraft");
const BrandBrief = require("../models/BrandBrief");
const { generateContentPost, generateContentIdeas } = require("../services/aiService");

// @route POST /api/content/generate
const generateContent = async (req, res) => {
  try {
    const { platform, topic, pillar } = req.body;

    if (!platform || !topic) {
      return res.status(400).json({
        success: false,
        message: "platform and topic are required",
      });
    }

    const brief = await BrandBrief.findOne({ userId: req.user._id });
    if (!brief) {
      return res.status(404).json({
        success: false,
        message: "No Brand Brief found — complete onboarding first",
      });
    }

    if (pillar && !brief.contentPillars.includes(pillar)) {
      return res.status(400).json({
        success: false,
        message: `pillar must be one of: ${brief.contentPillars.join(", ")}`,
      });
    }

    const generatedText = await generateContentPost(brief, platform, topic, pillar);

    const draft = await ContentDraft.create({
      userId: req.user._id,
      platform,
      topic,
      pillar: pillar || "",
      content: generatedText,
    });

    return res.status(201).json({
      success: true,
      message: "Content generated successfully",
      draft,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/content/generate-multi
// Body: { "platforms": ["linkedin", "instagram", "twitter"], "topic": "...", "pillar": "..." (optional) }
const generateMultiPlatform = async (req, res) => {
  try {
    const { platforms, topic, pillar } = req.body;

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "platforms must be a non-empty array, e.g. [\"linkedin\", \"instagram\"]",
      });
    }

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: "topic is required",
      });
    }

    const validPlatforms = ["linkedin", "instagram", "twitter"];
    const invalidPlatforms = platforms.filter((p) => !validPlatforms.includes(p));
    if (invalidPlatforms.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid platform(s): ${invalidPlatforms.join(", ")}. Must be one of: ${validPlatforms.join(", ")}`,
      });
    }

    const brief = await BrandBrief.findOne({ userId: req.user._id });
    if (!brief) {
      return res.status(404).json({
        success: false,
        message: "No Brand Brief found — complete onboarding first",
      });
    }

    if (pillar && !brief.contentPillars.includes(pillar)) {
      return res.status(400).json({
        success: false,
        message: `pillar must be one of: ${brief.contentPillars.join(", ")}`,
      });
    }

    // Generate posts for all platforms in parallel — faster than looping one at a time
    const results = await Promise.allSettled(
      platforms.map((platform) => generateContentPost(brief, platform, topic, pillar))
    );

    const drafts = [];
    const failures = [];

    for (let i = 0; i < results.length; i++) {
      const platform = platforms[i];
      const result = results[i];

      if (result.status === "fulfilled") {
        const draft = await ContentDraft.create({
          userId: req.user._id,
          platform,
          topic,
          pillar: pillar || "",
          content: result.value,
        });
        drafts.push(draft);
      } else {
        failures.push({ platform, error: result.reason.message });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Generated ${drafts.length} of ${platforms.length} posts`,
      drafts,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/content
const getContent = async (req, res) => {
  try {
    const drafts = await ContentDraft.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, drafts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/content/:id
const deleteContent = async (req, res) => {
  try {
    const draft = await ContentDraft.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    return res.status(200).json({ success: true, message: "Draft deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/content/:id/schedule
// Body: { "scheduledDate": "2026-07-20" }
const scheduleContent = async (req, res) => {
  try {
    const { scheduledDate } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "scheduledDate is required",
      });
    }

    const draft = await ContentDraft.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { scheduledDate, status: "scheduled" },
      { new: true }
    );

    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Draft scheduled successfully",
      draft,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/content/planner?start=2026-07-14&end=2026-07-20
const getPlanner = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "start and end query params are required (YYYY-MM-DD)",
      });
    }

    const drafts = await ContentDraft.find({
      userId: req.user._id,
      scheduledDate: {
        $gte: new Date(start),
        $lte: new Date(end),
      },
    }).sort({ scheduledDate: 1 });

    return res.status(200).json({ success: true, drafts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/content/ideas
// Body: { "count": 8 }  (count is optional, defaults to 8)
const getContentIdeas = async (req, res) => {
  try {
    const count = req.body.count || 8;

    const brief = await BrandBrief.findOne({ userId: req.user._id });
    if (!brief) {
      return res.status(404).json({
        success: false,
        message: "No Brand Brief found — complete onboarding first",
      });
    }

    const ideas = await generateContentIdeas(brief, count);

    return res.status(200).json({
      success: true,
      ideas,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateContent,
  generateMultiPlatform,
  getContent,
  deleteContent,
  scheduleContent,
  getPlanner,
  getContentIdeas,
};