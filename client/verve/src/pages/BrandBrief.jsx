import { useState } from "react";
import api from "../services/api";
import AppLayout, { PageHeader } from "../layouts/AppLayout.jsx";
import { Alert, Button, Field, Textarea } from "../components/ui.jsx";

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
    <AppLayout>
      <div className="px-6 pb-24 pt-11 sm:px-12">
        <PageHeader
          eyebrow="Profile Makeover"
          title={<>Rewrite your<br />LinkedIn profile</>}
          blurb="Paste your current headline and About section. We'll rewrite them using your Brand Brief, so they sound like the person you're trying to become known as."
        />

        <div className="mt-10 grid gap-7 sm:grid-cols-2">
          <Field
            label="Current headline"
            placeholder="e.g. Software Engineer at TechCorp"
            value={currentHeadline}
            onChange={(e) => setCurrentHeadline(e.target.value)}
          />
          <Textarea
            label="Current About section"
            rows={6}
            placeholder="Paste your current About text here…"
            value={currentAbout}
            onChange={(e) => setCurrentAbout(e.target.value)}
          />
        </div>

        {error && <Alert className="mt-8">{error}</Alert>}

        <Button
          onClick={handleOptimize}
          disabled={!currentHeadline && !currentAbout}
          loading={loading}
          className="mt-8"
        >
          {loading ? "Rewriting…" : "Optimize my profile"}
        </Button>

        {result && (
          <div className="mt-14 border-t border-hair pt-10">
            <div className="verve-eyebrow">Before / after</div>

            <div className="mt-[26px] grid gap-px overflow-hidden rounded-2xl border border-bd bg-hair sm:grid-cols-2">
              <div className="bg-panel px-[30px] py-7">
                <div className="verve-label">Before — headline</div>
                <p className="mt-3.5 text-[17px] leading-snug text-faint line-through">
                  {currentHeadline || "(none provided)"}
                </p>
              </div>
              <div className="bg-raised-2 px-[30px] py-7">
                <div className="verve-label text-accent">After — headline</div>
                <div className="mt-3.5 flex items-start justify-between gap-3">
                  <p className="text-[22px] leading-snug text-head">{result.optimizedHeadline}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy("headline", result.optimizedHeadline)}
                    className="shrink-0 font-mono text-xs uppercase tracking-widest text-accent hover:underline"
                  >
                    {copiedField === "headline" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="bg-panel px-[30px] py-7">
                <div className="verve-label">Before — About</div>
                <p className="mt-3.5 whitespace-pre-wrap text-sm leading-relaxed text-faint line-through">
                  {currentAbout || "(none provided)"}
                </p>
              </div>
              <div className="bg-raised-2 px-[30px] py-7">
                <div className="verve-label text-accent">After — About</div>
                <div className="mt-3.5 flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-head">{result.optimizedAbout}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy("about", result.optimizedAbout)}
                    className="shrink-0 font-mono text-xs uppercase tracking-widest text-accent hover:underline"
                  >
                    {copiedField === "about" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {result.changesSummary && (
              <div className="mt-5 rounded-2xl border border-tint-bd bg-tint px-6 py-[22px]">
                <div className="verve-label text-accent">What changed</div>
                <p className="mt-3 text-[15px] leading-relaxed text-label">{result.changesSummary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BrandBrief;
