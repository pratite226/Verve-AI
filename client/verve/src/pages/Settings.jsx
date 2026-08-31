import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import AppLayout, { PageHeader } from "../layouts/AppLayout.jsx";
import { Alert, Button, Field } from "../components/ui.jsx";

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
    navigate("/");
  };

  return (
    <AppLayout>
      <div className="max-w-[860px] px-6 pb-24 pt-11 sm:px-12">
        <PageHeader eyebrow="Settings" title={<>Edit your<br />Brand Brief</>} />

        {loading && <p className="mt-8 text-sm text-muted">Loading…</p>}

        {!loading && (
          <div className="mt-11 flex flex-col gap-[26px]">
            <Field
              as="textarea"
              rows={2}
              label="Positioning"
              value={form.positioning}
              onChange={(e) => updateField("positioning", e.target.value)}
            />
            <Field
              as="textarea"
              rows={2}
              label="Tagline"
              value={form.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
            />
            <Field
              as="textarea"
              rows={2}
              label="Tone"
              value={form.tone}
              onChange={(e) => updateField("tone", e.target.value)}
            />
            <Field
              as="textarea"
              rows={2}
              label="Target audience"
              value={form.targetAudience}
              onChange={(e) => updateField("targetAudience", e.target.value)}
            />
            <Field
              as="textarea"
              rows={2}
              label="Mission"
              value={form.mission}
              onChange={(e) => updateField("mission", e.target.value)}
            />

            <div>
              <div className="flex items-center justify-between">
                <span className="verve-field-label">Content pillars</span>
                {form.contentPillars.length > 0 && (
                  <span className={`font-mono text-xs ${totalWeight === 100 ? "text-accent" : "text-danger"}`}>
                    {totalWeight}% total
                  </span>
                )}
              </div>
              <div className="mt-3.5 flex flex-col gap-2">
                {form.contentPillars.map((pillar, i) => (
                  <div key={i} className="flex items-center gap-3.5 rounded-xl border border-bd bg-panel px-4 py-3">
                    <span className="flex-1 text-[15px] text-text">{pillar}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={pillarWeight(pillar)}
                      onChange={(e) => setPillarWeight(pillar, e.target.value)}
                      className="w-[62px] rounded-lg border border-bd bg-transparent px-2.5 py-1.5 text-right font-mono text-xs text-text outline-none"
                    />
                    <span className="font-mono text-xs text-muted">%</span>
                    <button
                      type="button"
                      onClick={() => removePillar(i)}
                      className="px-1 text-[17px] text-muted hover:text-danger"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3.5 flex gap-3">
                <Field
                  className="flex-1"
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
                <Button variant="ghost" onClick={addPillar} className="shrink-0 self-end">
                  Add
                </Button>
              </div>
            </div>

            {error && <Alert>{error}</Alert>}

            <div className="flex items-center gap-[18px]">
              <Button onClick={handleSave} loading={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              {saved && <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">Saved</span>}
            </div>
          </div>
        )}

        <div className="mt-14 border-t border-hair pt-7">
          <span className="verve-label">Account</span>
          <p className="mt-3 text-[15px] text-label">{user?.email}</p>
          <Button variant="ghost" onClick={handleLogout} className="mt-5 hover:border-danger! hover:text-danger!">
            Log out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
