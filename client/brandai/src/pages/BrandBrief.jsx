import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

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
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-8">
        <Link to="/dashboard" className="font-display text-lg">BrandPilot</Link>
        <nav className="flex items-center gap-6">
          <Link to="/dashboard" className="font-mono text-xs uppercase tracking-widest text-muted hover:text-ink">
            Dashboard
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-24">
        <p className="byline">Profile Makeover</p>
        <h1 className="mt-4 font-display text-4xl">Rewrite your LinkedIn profile</h1>
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          Paste your current headline and About section. We'll rewrite them using your Brand Brief,
          so they actually sound like the person you're trying to become known as.
        </p>

        {/* Input */}
        <div className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-2">
          <div>
            <p className="field-label">Current headline</p>
            <input
              className="field-input mt-2"
              placeholder="e.g. Software Engineer at TechCorp"
              value={currentHeadline}
              onChange={(e) => setCurrentHeadline(e.target.value)}
            />
          </div>
          <div className="sm:row-span-2">
            <p className="field-label">Current About section</p>
            <textarea
              rows={8}
              className="field-input mt-2 resize-none"
              placeholder="Paste your current About text here..."
              value={currentAbout}
              onChange={(e) => setCurrentAbout(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

        <button
          type="button"
          onClick={handleOptimize}
          disabled={loading || (!currentHeadline && !currentAbout)}
          className="btn-primary mt-8 disabled:opacity-40"
        >
          {loading ? "Rewriting…" : "Optimize my profile"}
        </button>

        {/* Before / After */}
        {result && (
          <div className="mt-16 border-t border-line pt-10">
            <p className="byline">Before / after</p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="field-label">Before — headline</p>
                <p className="mt-2 text-sm text-ink/60 line-through">{currentHeadline || "(none provided)"}</p>
              </div>
              <div>
                <p className="field-label">After — headline</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <p className="font-display text-lg leading-snug">{result.optimizedHeadline}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy("headline", result.optimizedHeadline)}
                    className="shrink-0 font-mono text-xs uppercase tracking-widest text-cobalt hover:underline"
                  >
                    {copiedField === "headline" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <p className="field-label">Before — About</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink/60 line-through">
                  {currentAbout || "(none provided)"}
                </p>
              </div>
              <div>
                <p className="field-label">After — About</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.optimizedAbout}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy("about", result.optimizedAbout)}
                    className="shrink-0 font-mono text-xs uppercase tracking-widest text-cobalt hover:underline"
                  >
                    {copiedField === "about" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {result.changesSummary && (
              <div className="mt-8 border border-line p-4">
                <p className="field-label">What changed</p>
                <p className="mt-2 text-sm text-ink/80">{result.changesSummary}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrandBrief;