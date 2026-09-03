import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Logo from "../components/Logo.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import GoogleSignInButton from "../components/GoogleSignInButton.jsx";
import { Alert, Button } from "../components/ui.jsx";
import { passwordChecks, PASSWORD_PATTERN_ATTR, PASSWORD_PATTERN_TITLE } from "../utils/passwordRules";

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

  const handleGoogleSuccess = (needsOnboarding) => navigate(needsOnboarding ? "/onboarding" : "/dashboard");

  const checks = passwordChecks(form.password);

  return (
    <div className="grid min-h-screen sm:grid-cols-[1.15fr_1fr]">
      <div className="hidden flex-col justify-between border-r border-hair bg-panel p-10 sm:flex">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div>
          <div className="verve-eyebrow">New here</div>
          <h1
            className="mt-6 font-extrabold tracking-[-0.045em] text-head"
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

      <div className="flex items-center justify-center bg-bg p-10">
        <div className="w-full max-w-[400px]">
          <div className="flex gap-1 rounded-full border border-bd-2 bg-panel p-1">
            <Link to="/login" className="flex-1 rounded-full py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Log in
            </Link>
            <span className="flex-1 rounded-full bg-accent py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-on-accent">
              Sign up
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-6">
            <div className="relative">
              <label className="verve-field-label" htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                className="verve-field mt-2"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="relative">
              <label className="verve-field-label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="verve-field mt-2"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="relative">
              <label className="verve-field-label" htmlFor="password">Password</label>
              <PasswordInput
                id="password"
                name="password"
                className="verve-field mt-2"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setPasswordTouched(true)}
                required
                minLength={8}
                pattern={PASSWORD_PATTERN_ATTR}
                title={PASSWORD_PATTERN_TITLE}
              />
              <ul
                className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 overflow-hidden text-xs transition-[max-height,opacity] duration-300 ${
                  passwordTouched ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {checks.map((check) => (
                  <li
                    key={check.label}
                    className={`flex items-center gap-1 transition-colors duration-200 ${check.met ? "text-accent" : "text-muted"}`}
                  >
                    <span aria-hidden="true">{check.met ? "✓" : "·"}</span>
                    {check.label}
                  </li>
                ))}
              </ul>
            </div>

            {error && <Alert>{error}</Alert>}

            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? "Creating account…" : "Create account"}
            </Button>

            <p className="text-sm text-muted">By continuing you agree to the terms.</p>
          </form>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <>
              <div className="mt-7 flex items-center gap-4">
                <span className="h-px flex-1 bg-hair" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Or</span>
                <span className="h-px flex-1 bg-hair" />
              </div>
              <div className="mt-5">
                <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={setError} />
              </div>
            </>
          )}

          <p className="mt-6 text-sm text-muted">
            Already have an account?{" "}
            <Link to="/login" className="link-underline text-accent">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
