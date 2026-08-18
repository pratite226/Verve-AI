const Analytics = require("../models/Analytics");

const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Upserts today's snapshot counters for a user. Called right after a ContentDraft is
// created or its status changes, so the embedded window stays in sync with real writes
// instead of being recomputed from scratch on every read.
const recordDraftEvent = async (userId, { platform, status, isNew }) => {
  const date = todayKey();

  // Ensure the user has an Analytics doc and today's snapshot entry exists before $inc'ing
  // into it — Mongo can't $inc a field inside an array element that doesn't exist yet.
  await Analytics.updateOne(
    { userId, "dailySnapshots.date": { $ne: date } },
    { $push: { dailySnapshots: { date } }, $setOnInsert: { userId } },
    { upsert: true }
  );

  const inc = {};
  if (isNew) {
    inc["dailySnapshots.$.postsCreated"] = 1;
    if (platform) inc[`dailySnapshots.$.postsByPlatform.${platform}`] = 1;
  }
  if (status) {
    inc[`dailySnapshots.$.postsByStatus.${status}`] = 1;
  }

  if (Object.keys(inc).length > 0) {
    await Analytics.updateOne({ userId, "dailySnapshots.date": date }, { $inc: inc });
  }
};

module.exports = { recordDraftEvent };
