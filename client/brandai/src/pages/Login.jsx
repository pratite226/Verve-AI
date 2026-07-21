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
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <p className="byline">Welcome back</p>
        <h1 className="mt-4 font-display text-3xl">Log in</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
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
          <div>
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

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          New here?{" "}
          <Link to="/signup" className="text-cobalt underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;