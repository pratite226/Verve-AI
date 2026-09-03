const mongoose = require("mongoose");

// One-time, idempotent repair for the `users.googleId` index. Earlier versions of the User
// schema declared `googleId: { default: null, unique: true, sparse: true }`, which builds a
// sparse unique index that still indexes documents whose value is null — so the second
// email/password account (all of which stored `googleId: null`) failed to insert with
// `E11000 dup key: { googleId: null }`. The schema now stores no `googleId` at all for those
// accounts and declares a partial unique index instead (see models/User.js).
//
// This runs on every boot; each step is a no-op once the database is already fixed:
//   1. Unset any lingering `googleId: null` so the value is truly absent.
//   2. Drop the stale `googleId_1` index unless it is already the partial one.
//   3. Rebuild indexes from the current schema (creates the partial unique index).
const repairUserIndexes = async () => {
  try {
    const User = mongoose.model("User");
    const db = mongoose.connection.db;

    // Fresh database — no `users` collection yet, so there is nothing to migrate. Just build
    // the current schema's indexes (creates the collection + partial unique index).
    const exists = await db.listCollections({ name: "users" }).hasNext();
    if (!exists) {
      await User.createIndexes();
      return;
    }

    const coll = db.collection("users");

    const unset = await coll.updateMany(
      { googleId: null },
      { $unset: { googleId: "" } }
    );

    let droppedStale = false;
    const indexes = await coll.indexes();
    const existing = indexes.find((ix) => ix.name === "googleId_1");
    if (existing && !existing.partialFilterExpression) {
      await coll.dropIndex("googleId_1");
      droppedStale = true;
    }

    await User.createIndexes();

    if (unset.modifiedCount > 0 || droppedStale) {
      console.log(
        `[repairUserIndexes] googleId fixed — unset ${unset.modifiedCount} null value(s)` +
          `${droppedStale ? ", dropped stale googleId_1 index" : ""}`
      );
    }
  } catch (error) {
    // Never block boot on this — the app still works for the first Google-less account, and
    // a loud log lets the operator run the fix manually.
    console.error("[repairUserIndexes] failed:", error.message);
  }
};

module.exports = repairUserIndexes;
