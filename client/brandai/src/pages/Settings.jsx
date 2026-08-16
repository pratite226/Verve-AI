import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    positioning: "",
    tagline: "",
    tone: "",
    targetAudience: "",
    mission: "",
    contentPillars: [],
    pillarWeights: {},
  });
  const [pillarInput, setPillarInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get("/brand")
      .then((res) => {
        const b = res.data.brief;
        setForm({
          positioning: b.positioning || "",
          tagline: b.tagline || "",
          tone: b.tone || "",
          targetAudience: b.targetAudience || "",
          mission: b.mission || "",
          contentPillars: b.contentPillars || [],
          pillarWeights: b.pillarWeights || {},
        });
      })
      .catch(() => setError("Couldn't load your Brand Brief."))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value });
    setSaved(false);
  };

  const addPillar = () => {
    const name = pillarInput.trim();
    if (!name) return;
    setForm({
      ...form,
      contentPillars: [...form.contentPillars, name],
      pillarWeights: { ...form.pillarWeights, [name]: 0 },
    });
    setPillarInput("");
    setSaved(false);
  };

  const removePillar = (index) => {
    const name = form.contentPillars[index];
    const restWeights = { ...form.pillarWeights };
    delete restWeights[name];
    setForm({
      ...form,
      contentPillars: form.contentPillars.filter((_, i) => i !== index),
      pillarWeights: restWeights,
    });
    setSaved(false);
  };

  const pillarWeight = (name) =>
    form.pillarWeights[name] ?? Math.round(100 / (form.contentPillars.length || 1));

  const setPillarWeight = (name, value) => {
    const weight = Math.max(0, Math.min(100, Number(value) || 0));
    setForm({ ...form, pillarWeights: { ...form.pillarWeights, [name]: weight } });
    setSaved(false);
  };

  const totalWeight = form.contentPillars.reduce((sum, name) => sum + pillarWeight(name), 0);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.put("/brand", form);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-8">
        <Link to="/dashboard" className="font-display text-lg">BrandPilot</Link>
        <Link to="/dashboard" className="font-mono text-xs uppercase tracking-widest text-muted hover:text-ink">
          Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        <p className="byline">Settings</p>
        <h1 className="mt-4 font-display text-4xl">Edit your Brand Brief</h1>

        {loading && <p className="mt-8 text-sm text-muted">Loading…</p>}

        {!loading && (
          <div className="mt-10 space-y-6 border-t border-line pt-8">
            <div>
              <label className="field-label">Positioning</label>
              <textarea
                rows={2}
                className="field-input mt-2 resize-none"
                value={form.positioning}
                onChange={(e) => updateField("positioning", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Tagline</label>
              <input
                className="field-input mt-2"
                value={form.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Tone</label>
              <input
                className="field-input mt-2"
                value={form.tone}
                onChange={(e) => updateField("tone", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Target audience</label>
              <textarea
                rows={2}
                className="field-input mt-2 resize-none"
                value={form.targetAudience}
                onChange={(e) => updateField("targetAudience", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Mission</label>
              <textarea
                rows={2}
                className="field-input mt-2 resize-none"
                value={form.mission}
                onChange={(e) => updateField("mission", e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="field-label">Content pillars</label>
                {form.contentPillars.length > 0 && (
                  <span className={`font-mono text-xs ${totalWeight === 100 ? "text-muted" : "text-red-700"}`}>
                    {totalWeight}% total
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-2">
                {form.contentPillars.map((pillar, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-widest"
                  >
                    <span className="flex-1 normal-case tracking-normal font-body text-sm text-ink">{pillar}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={pillarWeight(pillar)}
                      onChange={(e) => setPillarWeight(pillar, e.target.value)}
                      className="w-16 border border-line bg-transparent px-2 py-1 text-right font-mono text-xs"
                    />
                    <span className="text-muted">%</span>
                    <button
                      type="button"
                      onClick={() => removePillar(i)}
                      className="text-muted hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="field-input"
                  placeholder="Add a content pillar"
                  value={pillarInput}
                  onChange={(e) => setPillarInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPillar();
                    }
                  }}
                />
                <button type="button" onClick={addPillar} className="btn-secondary shrink-0">
                  Add
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-700">{error}</p>}
            {saved && <p className="text-sm text-cobalt">Saved.</p>}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}

        <div className="mt-16 border-t border-line pt-8">
          <p className="field-label">Account</p>
          <p className="mt-2 text-sm text-ink/70">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary mt-4"
          >
            Log out
          </button>
        </div>
      </main>
    </div>
  );
};

export default Settings;