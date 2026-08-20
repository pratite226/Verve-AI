import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

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
    <div className="grid min-h-screen sm:grid-cols-[1.15fr_1fr]">
      <div className="hidden flex-col justify-between border-r border-line bg-paper-raised p-10 sm:flex">
        <div className="font-display text-[17px] font-extrabold tracking-tight">BRANDPILOT</div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">New here</div>
          <h1
            className="mt-6 font-display font-extrabold tracking-[-0.045em]"
            style={{ fontSize: "clamp(44px,6.6vw,104px)", lineHeight: 0.9 }}
          >
            START
            <br />
            THE
            <br />
            BRIEF.
          </h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          Positioning · Voice · Pillars · Plan
        </div>
      </div>

      <div className="flex items-center justify-center bg-paper p-10">
        <div className="w-full max-w-[400px]">
          <div className="flex gap-1 rounded-full border border-line bg-paper-raised p-1">
            <Link
              to="/login"
              className="flex-1 rounded-full py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
            >
              Log in
            </Link>
            <span className="flex-1 rounded-full py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.18em]" style={{ background: "var(--color-cobalt)", color: "var(--color-paper)" }}>
              Sign up
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-6">
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
                    className="flex items-center gap-1 transition-colors duration-200"
                    style={{ color: check.met ? "var(--color-cobalt)" : "var(--color-muted)" }}
                  >
                    <span aria-hidden="true">{check.met ? "✓" : "·"}</span>
                    {check.label}
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div className="rounded-sm border px-3.5 py-3 text-sm" style={{ borderColor: "#4A1F16", background: "#1A0C08", color: "#FF7A55" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} data-magnetic className="btn-primary w-full disabled:opacity-50">
              {submitting && <span className="spinner" aria-hidden="true" />}
              {submitting ? "Creating account…" : "Create account"}
            </button>

            <p className="text-sm text-muted">By continuing you agree to the terms.</p>
          </form>

          <p className="mt-6 text-sm text-muted">
            Already have an account?{" "}
            <Link to="/login" className="link-underline" style={{ color: "var(--color-cobalt)" }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
