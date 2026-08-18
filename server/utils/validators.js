const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email) => typeof email === "string" && EMAIL_RULE.test(email);

// Strips HTML tags from free-text user input before it's persisted, so stored content
// (canvas notes, topics, etc.) can't carry a stored-XSS payload into a future render.
// Not a full sanitizer for HTML we intend to render as markup — this app never does that,
// every field here is rendered as plain text, so tag-stripping is sufficient.
const sanitizeText = (value) => {
  if (typeof value !== "string") return value;
  return value.replace(/<[^>]*>/g, "").trim();
};

module.exports = { isValidEmail, sanitizeText };
