import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Logo from "../components/Logo.jsx";
import PasswordInput from "../components/PasswordInput.jsx";
import { useToast } from "../hooks/useToast.jsx";
import { Alert, Button } from "../components/ui.jsx";
import { passwordChecks, PASSWORD_PATTERN_ATTR, PASSWORD_PATTERN_TITLE } from "../utils/passwordRules";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checks = passwordChecks(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordsMatch) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      showToast("Password updated — log in with your new password.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "That reset link is invalid or has expired.");
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
            SET A NEW
            <br />
            PASSWORD.
          </h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          Positioning · Voice · Pillars · Plan
        </div>
      </div>

      <div className="flex items-center justify-center bg-bg p-10">
        <div className="w-full max-w-[400px]">
          <div className="verve-eyebrow">Reset password</div>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-head">Choose a new password</h2>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-6">
            <div className="relative">
              <label className="verve-field-label" htmlFor="password">New password</label>
              <PasswordInput
                id="password"
                className="verve-field mt-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <div className="relative">
              <label className="verve-field-label" htmlFor="confirmPassword">Confirm new password</label>
              <PasswordInput
                id="confirmPassword"
                className="verve-field mt-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <Alert>{error}</Alert>}

            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? "Updating…" : "Update password"}
            </Button>
          </form>

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

export default ResetPassword;
