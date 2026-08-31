import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Logo from "../components/Logo.jsx";
import { Alert, Button } from "../components/ui.jsx";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // The backend returns the same generic message whether or not the email is
      // registered — no account-enumeration signal for us to react to either.
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen sm:grid-cols-[1.15fr_1fr]">
      <div className="hidden flex-col justify-between border-r border-hair bg-panel p-10 sm:flex">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div>
          <div className="verve-eyebrow">Account recovery</div>
          <h1
            className="mt-6 font-extrabold tracking-[-0.045em] text-head"
            style={{ fontSize: "clamp(44px,6.6vw,104px)", lineHeight: 0.9 }}
          >
            LOSE THE
            <br />
            PASSWORD,
            <br />
            NOT THE BRIEF.
          </h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          Positioning · Voice · Pillars · Plan
        </div>
      </div>

      <div className="flex items-center justify-center bg-bg p-10">
        <div className="w-full max-w-[400px]">
          <div className="verve-eyebrow">Reset password</div>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-head">Forgot your password?</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Enter the email you signed up with and, if it matches an account, we'll send a link
            to reset your password.
          </p>

          {sent ? (
            <div className="mt-7 rounded-xl border border-bd bg-panel px-4 py-3.5 text-sm text-muted">
              If an account exists for <strong className="text-head">{email}</strong>, a reset
              link is on its way. It expires in 1 hour.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-6">
              <div className="relative">
                <label className="verve-field-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="verve-field mt-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {error && <Alert>{error}</Alert>}

              <Button type="submit" loading={submitting} className="w-full">
                {submitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-sm text-muted">
            Remembered it?{" "}
            <Link to="/login" className="link-underline text-accent">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
