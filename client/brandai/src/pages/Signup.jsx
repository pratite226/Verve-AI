import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <p className="byline">Create account</p>
        <h1 className="mt-4 font-display text-3xl">Start your brand brief</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
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
              minLength={6}
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-cobalt underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;