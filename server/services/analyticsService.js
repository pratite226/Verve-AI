const Analytics = require("../models/Analytics");

const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Upserts today's snapshot counters for a user. Called right after a ContentDraft is
// created or its status changes, so the embedded window stays in sync with real writes
// instead of being recomputed from scratch on every read.
const recordDraftEvent = async (userId, { platform, status, isNew }) => {
  const date = todayKey();

  // Ensure the Analytics doc exists first, as its own separate step — combining this with
  // the "does today's snapshot exist" check below via a single $ne + upsert:true was the
  // original approach, but it's a classic Mongo footgun: once today's snapshot already
  // exists, the $ne condition excludes the existing document from the match, so upsert:true
  // tries to INSERT A SECOND document with the same userId — which throws, since userId has
  // a unique index. That meant every event after the first one for a given user on a given
  // day threw and was silently swallowed by the caller's .catch(), undercounting analytics
  // for the rest of the day. Splitting the "doc exists" upsert from the "today's snapshot
  // exists" push (no upsert on that one — see below) avoids ever attempting a second insert
  // for the same user. The duplicate-key catch here handles the narrow remaining race where
  // two events for a brand-new user's very first day fire concurrently (e.g.
  // generateMultiPlatform's per-platform calls) and both see no doc yet — one insert wins,
  // the other's duplicate-key error just means "already created," which is fine to ignore.
  try {
    await Analytics.updateOne(
      { userId },
      { $setOnInsert: { userId, dailySnapshots: [] } },
      { upsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }

  // No upsert here — the doc is now guaranteed to exist, so a non-match just means today's
  // snapshot was already pushed (by this call or a concurrent one), which is a no-op, not
  // an error.
  await Analytics.updateOne(
    { userId, "dailySnapshots.date": { $ne: date } },
    { $push: { dailySnapshots: { date } } }
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
