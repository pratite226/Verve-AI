import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Logo from "../components/Logo.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import GoogleSignInButton from "../components/GoogleSignInButton.jsx";
import { Alert, Button } from "../components/ui.jsx";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = (isNewUser) => navigate(isNewUser ? "/onboarding" : "/dashboard");

  return (
    <div className="grid min-h-screen sm:grid-cols-[1.15fr_1fr]">
      <div className="hidden flex-col justify-between border-r border-hair bg-panel p-10 sm:flex">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div>
          <div className="verve-eyebrow">Welcome back</div>
          <h1
            className="mt-6 font-extrabold tracking-[-0.045em] text-head"
            style={{ fontSize: "clamp(44px,6.6vw,104px)", lineHeight: 0.9 }}
          >
            PICK UP
            <br />
            WHERE
            <br />
            YOU LEFT.
          </h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          Positioning · Voice · Pillars · Plan
        </div>
      </div>

      <div className="flex items-center justify-center bg-bg p-10">
        <div className="w-full max-w-[400px]">
          <div className="flex gap-1 rounded-full border border-bd-2 bg-panel p-1">
            <span className="flex-1 rounded-full bg-accent py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-on-accent">
              Log in
            </span>
            <Link to="/signup" className="flex-1 rounded-full py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Sign up
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-6">
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
                required
              />
            </div>

            {error && <Alert>{error}</Alert>}

            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? "Checking…" : "Log in"}
            </Button>

            <p className="text-sm text-muted">
              Forgot your password?{" "}
              <Link to="/forgot-password" className="link-underline text-accent">
                We can email a reset link.
              </Link>
            </p>
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
            New here?{" "}
            <Link to="/signup" className="link-underline text-accent">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
