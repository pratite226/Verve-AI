const mongoose = require("mongoose");
const ContentDraft = require("../models/ContentDraft");
const Analytics = require("../models/Analytics");
const { cacheGet, cacheSet } = require("../config/redis");

const OVERVIEW_TTL_SECONDS = 300;
const overviewCacheKey = (userId) => `analytics:overview:${userId}`;

// @route GET /api/analytics/overview
// Real Mongo aggregation pipeline (not app-code filtering): $match scopes to the caller's
// own drafts, $facet runs three independent $group/$sort breakdowns in a single round trip.
// Cached in Redis for 5 minutes — invalidated on any write that would change the numbers
// (see recordDraftEvent callers in contentController.js) rather than left to expire stale.
const getOverview = async (req, res) => {
  try {
    const cacheKey = overviewCacheKey(req.user._id);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached, cached: true });
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);

    const [result] = await ContentDraft.aggregate([
      { $match: { userId } },
      {
        $facet: {
          byPlatform: [
            { $group: { _id: "$platform", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byPillar: [
            { $match: { pillar: { $ne: "" } } },
            { $group: { _id: "$pillar", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    // .populate("userId", ...) is the referencing side of the model's embedding-vs-referencing
    // split (see the comment in models/Analytics.js): dailySnapshots is embedded and always
    // comes back for free with the document above, but userId is a stored ObjectId that has
    // to be explicitly dereferenced against the User collection to pull profile fields —
    // that's the whole distinction between the two relationship types in practice.
    const analytics = await Analytics.findOne({ userId }).populate("userId", "name industry");
    const recentSnapshots = (analytics?.dailySnapshots || []).slice(-30);
    const owner = analytics?.userId || req.user;

    const payload = {
      success: true,
      byPlatform: result?.byPlatform || [],
      byPillar: result?.byPillar || [],
      byStatus: result?.byStatus || [],
      recentSnapshots,
      profileContext: { name: owner.name, industry: owner.industry || "" },
    };

    await cacheSet(cacheKey, payload, OVERVIEW_TTL_SECONDS);

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getOverview, overviewCacheKey };
