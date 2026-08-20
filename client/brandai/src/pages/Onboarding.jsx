import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const CAREER_STAGES = [
  { value: "student", label: "Student" },
  { value: "early-career", label: "Early-career" },
  { value: "mid-career", label: "Mid-career" },
  { value: "founder", label: "Founder" },
  { value: "executive", label: "Executive" },
];

const QUIZ_QUESTIONS = [
  {
    key: "voiceStyle",
    question: "Which sounds more like you?",
    options: [
      { value: "direct and blunt", label: "Direct and to the point" },
      { value: "warm and conversational", label: "Warm and conversational" },
    ],
  },
  {
    key: "contentStyle",
    question: "Which do you gravitate toward?",
    options: [
      { value: "teaching what I know", label: "Teaching what I know" },
      { value: "sharing my journey and story", label: "Sharing my journey and story" },
    ],
  },
  {
    key: "goalStyle",
    question: "What matters more right now?",
    options: [
      { value: "being seen as a credible expert", label: "Being seen as a credible expert" },
      { value: "building a recognizable personal name", label: "Building a recognizable personal name" },
    ],
  },
];

const STEP_INFO = {
  1: ["Basics", "Let's start with\nthe basics", "Four quick facts. The AI needs a shape before it can find your voice."],
  2: ["Your voice today", "Paste your\nLinkedIn About", "Optional — if you have one, it helps the AI hear how you already sound."],
  3: ["Substance", "A couple\nmore things", "Specifics beat adjectives. One project and one ambition is enough."],
  4: ["Positioning quiz", "Quick\npositioning quiz", "Three either/ors. There are no wrong answers, only different brands."],
  5: ["Generate", "Ready to build\nyour Brand Brief", "Everything you shared, turned into a strategy you can edit."],
};

const readyTags = ["Positioning", "Tagline", "Tone", "Audience", "Mission", "Pillars"];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    role: "",
    industry: "",
    careerStage: "",
    goal: "",
    linkedinAbout: "",
    proudProject: "",
    wantToBeKnownAs: "",
  });

  const [quizAnswers, setQuizAnswers] = useState({});

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateQuiz = (key, value) => setQuizAnswers({ ...quizAnswers, [key]: value });

  const goNext = () => setStep((s) => Math.min(s + 1, 5));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleGenerate = async () => {
    setError("");
    setSubmitting(true);

    const payload = {
      whatTheyDo: form.role || form.linkedinAbout,
      industry: form.industry,
      careerStage: form.careerStage,
      goal: form.goal,
      audience: quizAnswers.goalStyle || "",
      personality: [quizAnswers.voiceStyle, quizAnswers.contentStyle, form.wantToBeKnownAs]
        .filter(Boolean)
        .join(". "),
      achievements: [form.proudProject, form.linkedinAbout].filter(Boolean).join(". "),
    };

    try {
      await api.post("/brand/generate", payload);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't generate your Brand Brief. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepIsValid = () => {
    if (step === 1) return form.role && form.industry && form.careerStage && form.goal;
    if (step === 3) return form.proudProject && form.wantToBeKnownAs;
    if (step === 4) return Object.keys(quizAnswers).length === QUIZ_QUESTIONS.length;
    return true;
  };

  const [kicker, title, blurb] = STEP_INFO[step];

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex items-center justify-between border-b border-line px-10 py-[22px]">
        <span className="font-display text-[17px] font-extrabold tracking-tight">BRANDPILOT</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">Step {step} of 5</span>
      </header>

      <div className="mt-6 flex gap-1.5 px-10">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="h-0.5 flex-1"
            style={{ background: n <= step ? "var(--color-cobalt)" : "#23232A" }}
          />
        ))}
      </div>

      <div className="mx-auto grid w-full max-w-[1440px] flex-1 gap-16 px-10 py-14 sm:grid-cols-2">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--color-cobalt)" }}>
            {kicker}
          </div>
          <h1
            className="mt-5 whitespace-pre-line font-display font-extrabold tracking-[-0.04em]"
            style={{ fontSize: "clamp(38px,4.6vw,74px)", lineHeight: 0.94 }}
          >
            {title}
          </h1>
          <p className="mt-6 max-w-[420px] text-base leading-relaxed text-muted">{blurb}</p>
        </div>

        <div className="w-full max-w-[520px]">
          {step === 1 && (
            <div className="flex flex-col gap-7">
              <div>
                <label className="field-label">What do you do?</label>
                <input
                  className="field-input mt-2"
                  placeholder="e.g. Backend engineer specializing in distributed systems"
                  value={form.role}
                  onChange={(e) => updateForm("role", e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Industry</label>
                <input
                  className="field-input mt-2"
                  placeholder="e.g. Software / SaaS"
                  value={form.industry}
                  onChange={(e) => updateForm("industry", e.target.value)}
                />
              </div>
              <div>
                <span className="field-label">Career stage</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CAREER_STAGES.map((cs) => (
                    <button
                      key={cs.value}
                      type="button"
                      onClick={() => updateForm("careerStage", cs.value)}
                      className={`chip ${form.careerStage === cs.value ? "chip-active" : ""}`}
                    >
                      {cs.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label">What's your goal with personal branding?</label>
                <input
                  className="field-input mt-2"
                  placeholder="e.g. Land a senior role in the next 6 months"
                  value={form.goal}
                  onChange={(e) => updateForm("goal", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <textarea
              rows={10}
              className="w-full resize-none rounded-sm border border-line p-[18px] text-[15px] leading-relaxed outline-none"
              style={{ background: "var(--color-paper-raised)" }}
              placeholder="Paste your headline and About text here…"
              value={form.linkedinAbout}
              onChange={(e) => updateForm("linkedinAbout", e.target.value)}
            />
          )}

          {step === 3 && (
            <div className="flex flex-col gap-7">
              <div>
                <label className="field-label">A project you're proud of</label>
                <textarea
                  rows={4}
                  className="mt-2.5 w-full resize-none rounded-sm border border-line p-4 text-[15px] leading-relaxed outline-none"
                  style={{ background: "var(--color-paper-raised)" }}
                  placeholder="e.g. Led our migration to Kubernetes, cut deploy time by 60%"
                  value={form.proudProject}
                  onChange={(e) => updateForm("proudProject", e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">How do you want to be known?</label>
                <textarea
                  rows={4}
                  className="mt-2.5 w-full resize-none rounded-sm border border-line p-4 text-[15px] leading-relaxed outline-none"
                  style={{ background: "var(--color-paper-raised)" }}
                  placeholder="e.g. The engineer who makes complex systems feel simple"
                  value={form.wantToBeKnownAs}
                  onChange={(e) => updateForm("wantToBeKnownAs", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-8">
              {QUIZ_QUESTIONS.map((q) => (
                <div key={q.key}>
                  <div className="field-label">{q.question}</div>
                  <div className="mt-3 flex flex-col gap-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateQuiz(q.key, opt.value)}
                        className={`rounded-sm border px-[18px] py-[15px] text-left text-[15px] transition-colors duration-150 ${
                          quizAnswers[q.key] === opt.value ? "" : "border-line text-muted"
                        }`}
                        style={
                          quizAnswers[q.key] === opt.value
                            ? { borderColor: "var(--color-cobalt)", background: "var(--color-cobalt)", color: "var(--color-paper)" }
                            : undefined
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="rounded-sm border border-line p-8" style={{ background: "var(--color-paper-raised)" }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--color-cobalt)" }}>
                Ready
              </div>
              <p className="mt-4 text-base leading-relaxed text-muted">
                We'll use everything you shared to build your positioning, tone, target audience,
                mission, and content pillars. You'll be able to edit all of it afterward.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {readyTags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8A867E]"
                    style={{ borderColor: "var(--color-line)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              {error && <p className="mt-6 text-sm" style={{ color: "#FF7A55" }}>{error}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line px-10 py-6">
        <button
          type="button"
          disabled={step === 1}
          onClick={goBack}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted disabled:opacity-0"
        >
          ← Back
        </button>

        {step < 5 ? (
          <button
            type="button"
            disabled={!stepIsValid()}
            onClick={goNext}
            data-magnetic
            className="btn-primary disabled:opacity-40"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={handleGenerate}
            data-magnetic
            className="btn-primary disabled:opacity-50"
          >
            {submitting && <span className="spinner" aria-hidden="true" />}
            {submitting ? "Generating your brief…" : "Generate my Brand Brief"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
