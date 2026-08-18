const cron = require("node-cron");
const prisma = require("../config/prisma");
const Analytics = require("../models/Analytics");

const SNAPSHOT_RETENTION_DAYS = 90;

// Subscriptions whose billing period has lapsed without a renewal payment flip to
// past_due — Stripe would normally retry the charge and fire another webhook event to
// bring them back to active; this sweep just catches the ones that fell through.
const sweepExpiredSubscriptions = async () => {
  const result = await prisma.subscription.updateMany({
    where: { status: "active", currentPeriodEnd: { lt: new Date() } },
    data: { status: "past_due" },
  });
  if (result.count > 0) {
    console.log(`[cron] flipped ${result.count} subscription(s) to past_due`);
  }
};

// Keeps each user's embedded Analytics.dailySnapshots array bounded — see the "embedding"
// note in LLD.md: this is what keeps that embedded array from growing forever.
const pruneOldAnalyticsSnapshots = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SNAPSHOT_RETENTION_DAYS);
  const cutoffKey = cutoff.toISOString().slice(0, 10);

  const result = await Analytics.updateMany(
    {},
    { $pull: { dailySnapshots: { date: { $lt: cutoffKey } } } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[cron] pruned old analytics snapshots on ${result.modifiedCount} document(s)`);
  }
};

const startJobs = () => {
  // Daily at 03:00 server time — low-traffic hour, avoids contending with real requests.
  cron.schedule("0 3 * * *", () => {
    sweepExpiredSubscriptions().catch((err) =>
      console.error("[cron] sweepExpiredSubscriptions failed:", err.message)
    );
    pruneOldAnalyticsSnapshots().catch((err) =>
      console.error("[cron] pruneOldAnalyticsSnapshots failed:", err.message)
    );
  });
};

module.exports = { startJobs, sweepExpiredSubscriptions, pruneOldAnalyticsSnapshots };
