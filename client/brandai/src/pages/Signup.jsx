import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Reveal from "../components/Reveal.jsx";

const SPECIAL_CHAR_RE = /[!@#$%^&*(),.?":{}|<>]/;

const passwordChecks = (password) => [
  { label: "8+ characters", met: password.length >= 8 },
  { label: "a number", met: /\d/.test(password) },
  { label: "a special character", met: SPECIAL_CHAR_RE.test(password) },
];

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup(form);
      navigate("/onboarding");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const checks = passwordChecks(form.password);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <Reveal className="w-full max-w-sm auth-card px-8 py-10 sm:px-10 sm:py-12">
        <p className="byline">Create account</p>
        <h1 className="mt-4 font-display text-3xl">Start your brand brief</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="field-shell">
            <label className="field-label" htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              className="field-input"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field-shell">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="field-input"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field-shell">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="field-input"
              value={form.password}
              onChange={handleChange}
              onFocus={() => setPasswordTouched(true)}
              required
              minLength={8}
              pattern={'^(?=.*\\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$'}
              title="At least 8 characters, including a number and a special character"
            />
            <ul
              className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 overflow-hidden text-xs transition-[max-height,opacity] duration-300 ${
                passwordTouched ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {checks.map((check) => (
                <li
                  key={check.label}
                  className={`flex items-center gap-1 transition-colors duration-200 ${
                    check.met ? "text-cobalt" : "text-muted"
                  }`}
                >
                  <span aria-hidden="true">{check.met ? "✓" : "·"}</span>
                  {check.label}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="border border-red-700/30 bg-red-700/5 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting && <span className="spinner" aria-hidden="true" />}
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="link-underline text-cobalt">Log in</Link>
        </p>
      </Reveal>
    </div>
  );
};

export default Signup;
