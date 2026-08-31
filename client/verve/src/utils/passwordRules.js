// Shared by Signup.jsx and ResetPassword.jsx — both collect a new password against the
// exact same rule the server enforces (authController.js's PASSWORD_RULE), so this lives in
// one place rather than as two copies that could quietly drift apart.
const SPECIAL_CHAR_RE = /[!@#$%^&*(),.?":{}|<>]/;

export const passwordChecks = (password) => [
  { label: "8+ characters", met: password.length >= 8 },
  { label: "a number", met: /\d/.test(password) },
  { label: "a special character", met: SPECIAL_CHAR_RE.test(password) },
];

// HTML's pattern attribute is compiled with the regex "v" (unicodeSets) flag per the HTML
// spec — under that mode, (){}| must be escaped even inside a character class, unlike a
// plain JS RegExp literal (SPECIAL_CHAR_RE above, and the server's identical rule, neither of
// which need this escaping since they're not parsed as v-mode).
export const PASSWORD_PATTERN_ATTR = '^(?=.*\\d)(?=.*[!@#$%^&*\\(\\)\\{\\}\\|<>,.?":]).{8,}$';
export const PASSWORD_PATTERN_TITLE =
  "At least 8 characters, including a number and a special character";
