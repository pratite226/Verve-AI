const ContentDraft = require("../models/ContentDraft");
const BrandBrief = require("../models/BrandBrief");
const {
  generateContentPost,
  refineContentPost,
  generateWeeklyPlan,
  generateContentIdeas,
} = require("../services/aiService");
const { recordDraftEvent } = require("../services/analyticsService");
const { sanitizeText } = require("../utils/validators");
const { cacheGet, cacheSet, cacheDel } = require("../config/redis");
const { emitToUser } = require("../services/socketService");

const CONTENT_LIST_TTL_SECONDS = 300;
const contentListCacheKey = (userId) => `content:list:${userId}`;

// Every ContentDraft mutation invalidates both caches it could have changed the shape of —
// the content list itself, and the analytics overview (byPlatform/byPillar/byStatus counts
// derived from ContentDraft — see analyticsController.js).
const invalidateContentCaches = (userId) => {
  cacheDel(contentListCacheKey(userId)).catch(() => {});
  cacheDel(`analytics:overview:${userId}`).catch(() => {});
};

// @route POST /api/content/generate
const generateContent = async (req, res) => {
  try {
    const { platform, pillar, tone, length } = req.body;
    const topic = sanitizeText(req.body.topic);

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

    const generatedText = await generateContentPost(brief, platform, topic, pillar, tone, length);

    const draft = await ContentDraft.create({
      userId: req.user._id,
      platform,
      topic,
      pillar: pillar || "",
      content: generatedText,
    });

    // Fire-and-forget: analytics is a secondary read model, a failure here shouldn't fail
    // the primary content-generation request.
    recordDraftEvent(req.user._id, { platform, status: "draft", isNew: true }).catch((err) =>
      console.error("analytics recordDraftEvent failed:", err.message)
    );
    invalidateContentCaches(req.user._id);
    emitToUser(req.user._id, "draft:created", draft);

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
    const { platforms, pillar, tone, length } = req.body;
    const topic = sanitizeText(req.body.topic);

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
      platforms.map((platform) => generateContentPost(brief, platform, topic, pillar, tone, length))
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
        recordDraftEvent(req.user._id, { platform, status: "draft", isNew: true }).catch((err) =>
          console.error("analytics recordDraftEvent failed:", err.message)
        );
        drafts.push(draft);
      } else {
        failures.push({ platform, error: result.reason.message });
      }
    }

    if (drafts.length > 0) invalidateContentCaches(req.user._id);

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
    const cacheKey = contentListCacheKey(req.user._id);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, drafts: cached, cached: true });
    }

    const drafts = await ContentDraft.find({ userId: req.user._id }).sort({ createdAt: -1 });
    await cacheSet(cacheKey, drafts, CONTENT_LIST_TTL_SECONDS);

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

    invalidateContentCaches(req.user._id);

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

    invalidateContentCaches(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Draft scheduled successfully",
      draft,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/content/:id/status
// Body: { "status": "draft" | "scheduled" | "posted" }
const updateContentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["draft", "scheduled", "posted"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const draft = await ContentDraft.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { new: true }
    );

    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    recordDraftEvent(req.user._id, { status, isNew: false }).catch((err) =>
      console.error("analytics recordDraftEvent failed:", err.message)
    );
    invalidateContentCaches(req.user._id);
    emitToUser(req.user._id, "draft:statusChanged", draft);

    return res.status(200).json({
      success: true,
      message: "Draft status updated",
      draft,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/content/:id/refine
// Body: { "action": "improve" | "shorten" | "more_engaging" | "more_professional" | "more_casual" | "add_hook" | "add_cta" | "add_storytelling" }
const refineContent = async (req, res) => {
  try {
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, message: "action is required" });
    }

    const draft = await ContentDraft.findOne({ _id: req.params.id, userId: req.user._id });
    if (!draft) {
      return res.status(404).json({ success: false, message: "Draft not found" });
    }

    const brief = await BrandBrief.findOne({ userId: req.user._id });
    if (!brief) {
      return res.status(404).json({
        success: false,
        message: "No Brand Brief found — complete onboarding first",
      });
    }

    draft.content = await refineContentPost(brief, draft.platform, draft.content, action);
    await draft.save();
    invalidateContentCaches(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Draft refined successfully",
      draft,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/content/planner/generate
// Body: { "weekStart": "2026-07-14" }  (a Monday, YYYY-MM-DD)
const generateWeeklyPlanContent = async (req, res) => {
  try {
    const { weekStart } = req.body;

    if (!weekStart) {
      return res.status(400).json({ success: false, message: "weekStart is required (YYYY-MM-DD)" });
    }

    const brief = await BrandBrief.findOne({ userId: req.user._id });
    if (!brief) {
      return res.status(404).json({
        success: false,
        message: "No Brand Brief found — complete onboarding first",
      });
    }

    const validPlatforms = ["linkedin", "instagram", "twitter"];
    const assignments = await generateWeeklyPlan(brief);

    const results = await Promise.allSettled(
      assignments
        .filter((a) => validPlatforms.includes(a.platform) && a.dayOffset >= 0 && a.dayOffset <= 6)
        .map(async (a) => {
          const pillar = brief.contentPillars.includes(a.pillar) ? a.pillar : "";
          const content = await generateContentPost(brief, a.platform, a.topic, pillar);

          const scheduledDate = new Date(weekStart);
          scheduledDate.setDate(scheduledDate.getDate() + a.dayOffset);

          const draft = await ContentDraft.create({
            userId: req.user._id,
            platform: a.platform,
            topic: a.topic,
            pillar,
            content,
            status: "scheduled",
            scheduledDate,
          });

          recordDraftEvent(req.user._id, {
            platform: a.platform,
            status: "scheduled",
            isNew: true,
          }).catch((err) => console.error("analytics recordDraftEvent failed:", err.message));

          return draft;
        })
    );

    const drafts = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    const failures = results.filter((r) => r.status === "rejected").map((r) => r.reason.message);

    if (drafts.length > 0) invalidateContentCaches(req.user._id);

    return res.status(201).json({
      success: true,
      message: `Planned ${drafts.length} post${drafts.length === 1 ? "" : "s"} for the week`,
      drafts,
      failures: failures.length > 0 ? failures : undefined,
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
// Body: { "count": 8, "exclude": ["idea already shown", ...] }  (both optional)
const getContentIdeas = async (req, res) => {
  try {
    const count = req.body.count || 8;
    const exclude = Array.isArray(req.body.exclude) ? req.body.exclude : [];

    const brief = await BrandBrief.findOne({ userId: req.user._id });
    if (!brief) {
      return res.status(404).json({
        success: false,
        message: "No Brand Brief found — complete onboarding first",
      });
    }

    const ideas = await generateContentIdeas(brief, count, exclude);

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
  updateContentStatus,
  refineContent,
  generateWeeklyPlanContent,
  getPlanner,
  getContentIdeas,
};