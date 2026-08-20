import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

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

  return (
    <div className="grid min-h-screen sm:grid-cols-[1.15fr_1fr]">
      <div className="hidden flex-col justify-between border-r border-line bg-paper-raised p-10 sm:flex">
        <div className="font-display text-[17px] font-extrabold tracking-tight">BRANDPILOT</div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Welcome back</div>
          <h1
            className="mt-6 font-display font-extrabold tracking-[-0.045em]"
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

      <div className="flex items-center justify-center bg-paper p-10">
        <div className="w-full max-w-[400px]">
          <div className="flex gap-1 rounded-full border border-line bg-paper-raised p-1">
            <span className="flex-1 rounded-full py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.18em]" style={{ background: "var(--color-cobalt)", color: "var(--color-paper)" }}>
              Log in
            </span>
            <Link
              to="/signup"
              className="flex-1 rounded-full py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
            >
              Sign up
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-9 flex flex-col gap-6">
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
                required
              />
            </div>

            {error && (
              <div className="rounded-sm border px-3.5 py-3 text-sm" style={{ borderColor: "#4A1F16", background: "#1A0C08", color: "#FF7A55" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} data-magnetic className="btn-primary w-full disabled:opacity-50">
              {submitting && <span className="spinner" aria-hidden="true" />}
              {submitting ? "Checking…" : "Log in"}
            </button>

            <p className="text-sm text-muted">Forgot your password? We can email a reset link.</p>
          </form>

          <p className="mt-6 text-sm text-muted">
            New here?{" "}
            <Link to="/signup" className="link-underline" style={{ color: "var(--color-cobalt)" }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
