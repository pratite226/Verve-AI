import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/AppShell.jsx";

const Settings = () => {
  const { user } = useAuth();

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

  return (
    <AppShell>
      <div className="max-w-[860px] px-12 pb-24 pt-11">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Settings</div>
        <h1
          className="mt-4 font-display font-extrabold tracking-[-0.04em]"
          style={{ fontSize: "clamp(40px,5vw,72px)", lineHeight: 0.92 }}
        >
          Edit your
          <br />
          Brand Brief
        </h1>

        {loading && <p className="mt-8 text-sm text-muted">Loading…</p>}

        {!loading && (
          <div className="mt-11 flex flex-col gap-[26px]">
            <div>
              <label className="field-label">Positioning</label>
              <textarea
                rows={2}
                className="field-input mt-2.5 resize-none"
                value={form.positioning}
                onChange={(e) => updateField("positioning", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Tagline</label>
              <input className="field-input mt-2.5" value={form.tagline} onChange={(e) => updateField("tagline", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Tone</label>
              <input className="field-input mt-2.5" value={form.tone} onChange={(e) => updateField("tone", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Target audience</label>
              <textarea
                rows={2}
                className="field-input mt-2.5 resize-none"
                value={form.targetAudience}
                onChange={(e) => updateField("targetAudience", e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Mission</label>
              <textarea
                rows={2}
                className="field-input mt-2.5 resize-none"
                value={form.mission}
                onChange={(e) => updateField("mission", e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="field-label">Content pillars</label>
                {form.contentPillars.length > 0 && (
                  <span className="font-mono text-xs" style={{ color: totalWeight === 100 ? "var(--color-cobalt)" : "#FF7A55" }}>
                    {totalWeight}% total
                  </span>
                )}
              </div>
              <div className="mt-3.5 flex flex-col gap-2">
                {form.contentPillars.map((pillar, i) => (
                  <div key={i} className="flex items-center gap-3.5 rounded-sm border border-line bg-paper-raised px-4 py-3">
                    <span className="flex-1 text-[15px]">{pillar}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={pillarWeight(pillar)}
                      onChange={(e) => setPillarWeight(pillar, e.target.value)}
                      className="w-[62px] rounded-sm border border-line bg-transparent px-2.5 py-1.5 text-right font-mono text-xs outline-none"
                    />
                    <span className="font-mono text-xs text-muted">%</span>
                    <button type="button" onClick={() => removePillar(i)} className="px-1 text-[17px] text-muted hover:text-red-400">
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3.5 flex gap-3">
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
                <button type="button" onClick={addPillar} className="btn-secondary shrink-0">Add</button>
              </div>
            </div>

            {error && <p className="text-sm" style={{ color: "#FF7A55" }}>{error}</p>}

            <div className="flex items-center gap-[18px]">
              <button type="button" onClick={handleSave} disabled={saving} data-magnetic className="btn-primary disabled:opacity-50">
                {saving && <span className="spinner" aria-hidden="true" />}
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved && (
                <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--color-cobalt)" }}>
                  Saved
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-14 border-t border-line pt-7">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Account</span>
          <p className="mt-3 text-[15px]" style={{ color: "#A5A199" }}>{user?.email}</p>
        </div>
      </div>
    </AppShell>
  );
};

export default Settings;
