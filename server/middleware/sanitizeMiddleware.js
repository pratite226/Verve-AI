const mongoSanitize = require("express-mongo-sanitize");

// NoSQL injection awareness: a raw JSON body lets an attacker send operators instead of
// values — e.g. POST /api/auth/login { "email": { "$gt": "" }, "password": { "$gt": "" } }
// would otherwise reach Mongoose as a query operator, not a string, and could match the
// first user in the collection regardless of credentials. `mongoSanitize.sanitize` strips
// any object key starting with "$" or containing "." from body/params/query in place, so
// operator injection payloads collapse to sanitized plain objects before any controller
// (or a schema query built from `req.body`/`req.query`) ever sees them.
//
// Called as `mongoSanitize.sanitize(...)` directly rather than mounting the package's own
// middleware — that variant reassigns `req.query`, which Express 5 exposes as a getter-only
// property and throws on. `sanitize()` mutates each object's own keys in place instead.
const sanitizeInputs = (req, res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.params);
  mongoSanitize.sanitize(req.query);
  next();
};

module.exports = sanitizeInputs;
