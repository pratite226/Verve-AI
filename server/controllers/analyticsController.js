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

    const analytics = await Analytics.findOne({ userId });
    const recentSnapshots = (analytics?.dailySnapshots || []).slice(-30);

    const payload = {
      success: true,
      byPlatform: result?.byPlatform || [],
      byPillar: result?.byPillar || [],
      byStatus: result?.byStatus || [],
      recentSnapshots,
    };

    await cacheSet(cacheKey, payload, OVERVIEW_TTL_SECONDS);

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getOverview, overviewCacheKey };
