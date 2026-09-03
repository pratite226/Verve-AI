// Shared 500 responder. Controllers used to send `error.message` straight to the client,
// which leaked ORM internals (Prisma printed a source excerpt + container file paths) and
// datastore details (Mongo's E11000 exposes the DB name, collection, and index). This logs
// the full error server-side and returns a generic message in production, keeping the
// detailed message only in non-production for local debugging.
const respondServerError = (res, error) => {
  console.error(error);

  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong. Please try again."
      : error.message;

  return res.status(500).json({ success: false, message });
};

module.exports = { respondServerError };
