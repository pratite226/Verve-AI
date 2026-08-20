import { useState } from "react";
import api from "../services/api";
import AppShell from "../components/AppShell.jsx";

const BrandBrief = () => {
  const [currentHeadline, setCurrentHeadline] = useState("");
  const [currentAbout, setCurrentAbout] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [copiedField, setCopiedField] = useState(null);

  const handleOptimize = async () => {
    if (!currentHeadline && !currentAbout) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data } = await api.post("/profile/optimize", {
        currentHeadline,
        currentAbout,
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't optimize your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (field, text) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <AppShell>
      <div className="px-12 pb-24 pt-11">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Profile Makeover</div>
        <h1
          className="mt-4 font-display font-extrabold tracking-[-0.04em]"
          style={{ fontSize: "clamp(40px,5vw,80px)", lineHeight: 0.92 }}
        >
          Rewrite your
          <br />
          LinkedIn profile
        </h1>
        <p className="mt-6 max-w-[560px] text-base leading-relaxed text-[#8A867E]">
          Paste your current headline and About section. We'll rewrite them using your Brand
          Brief, so they sound like the person you're trying to become known as.
        </p>

        <div className="mt-10 grid gap-7 sm:grid-cols-2">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Current headline</span>
            <input
              className="field-input mt-2.5"
              placeholder="e.g. Software Engineer at TechCorp"
              value={currentHeadline}
              onChange={(e) => setCurrentHeadline(e.target.value)}
            />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Current About section</span>
            <textarea
              rows={6}
              className="mt-2.5 w-full resize-none rounded-sm border border-line p-4 text-[15px] leading-relaxed outline-none"
              style={{ background: "var(--color-paper-raised)" }}
              placeholder="Paste your current About text here…"
              value={currentAbout}
              onChange={(e) => setCurrentAbout(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-sm border px-4 py-3.5 text-sm" style={{ borderColor: "#4A1F16", background: "#1A0C08", color: "#FF7A55" }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleOptimize}
          disabled={loading || (!currentHeadline && !currentAbout)}
          data-magnetic
          className="btn-primary mt-8 disabled:opacity-40"
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? "Rewriting…" : "Optimize my profile"}
        </button>

        {result && (
          <div className="mt-14 border-t border-line pt-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Before / after</div>

            <div className="mt-[26px] grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
              <div className="bg-paper-raised px-[30px] py-7">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Before — headline</div>
                <p className="mt-3.5 text-[17px] leading-snug line-through" style={{ color: "var(--color-muted)" }}>
                  {currentHeadline || "(none provided)"}
                </p>
              </div>
              <div className="bg-paper-raised px-[30px] py-7" style={{ background: "#0E0E11" }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--color-cobalt)" }}>After — headline</div>
                <div className="mt-3.5 flex items-start justify-between gap-3">
                  <p className="text-[22px] font-display leading-snug">{result.optimizedHeadline}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy("headline", result.optimizedHeadline)}
                    className="shrink-0 font-mono text-xs uppercase tracking-widest hover:underline"
                    style={{ color: "var(--color-cobalt)" }}
                  >
                    {copiedField === "headline" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="bg-paper-raised px-[30px] py-7">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Before — About</div>
                <p className="mt-3.5 whitespace-pre-wrap text-sm leading-relaxed line-through" style={{ color: "var(--color-muted)" }}>
                  {currentAbout || "(none provided)"}
                </p>
              </div>
              <div className="bg-paper-raised px-[30px] py-7" style={{ background: "#0E0E11" }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--color-cobalt)" }}>After — About</div>
                <div className="mt-3.5 flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed" style={{ color: "#CFCCC5" }}>{result.optimizedAbout}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy("about", result.optimizedAbout)}
                    className="shrink-0 font-mono text-xs uppercase tracking-widest hover:underline"
                    style={{ color: "var(--color-cobalt)" }}
                  >
                    {copiedField === "about" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {result.changesSummary && (
              <div className="mt-5 rounded border px-6 py-[22px]" style={{ borderColor: "#23231F", background: "#101210" }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--color-cobalt)" }}>What changed</div>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "#A5A199" }}>{result.changesSummary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default BrandBrief;
