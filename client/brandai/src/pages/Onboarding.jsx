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

  const updateForm = (field, value) => {
  setForm((prev) => ({
    ...prev,
    [field]: value,
  }));
};
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-lg">
        <p className="byline">Step {step} of 5</p>
        <div className="mt-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className={`h-px flex-1 ${n <= step ? "bg-cobalt" : "bg-line"}`} />
          ))}
        </div>

        {/* STEP 1 — Basic info */}
        {step === 1 && (
          <div className="mt-10">
            <h1 className="font-display text-3xl leading-snug">Let's start with the basics</h1>
            <div className="mt-8 space-y-6">
              <div>
                <label className="field-label">What do you do?</label>
                <input
                  className="field-input"
                  placeholder="e.g. Backend engineer specializing in distributed systems"
                  value={form.role}
                  onChange={(e) => updateForm("role", e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Industry</label>
                <input
                  className="field-input"
                  placeholder="e.g. Software / SaaS"
                  value={form.industry}
                  onChange={(e) => updateForm("industry", e.target.value)}
                />
              </div>
              <div>
  <label className="field-label">Career stage</label>

  <div className="mt-2 flex flex-wrap gap-3">
    {CAREER_STAGES.map((cs) => (
      <button
        key={cs.value}
        type="button"
        onClick={() => updateForm("careerStage", cs.value)}
        className={`rounded-md border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-200 ${
          form.careerStage === cs.value
            ? "bg-black text-white border-black"
            : "bg-white text-gray-700 border-gray-300 hover:border-black"
        }`}
      >
        {cs.label}
      </button>
    ))}
  </div>

  <p className="mt-2 text-sm text-gray-500">
    Selected: {form.careerStage || "None"}
  </p>
</div>
              <div>
                <label className="field-label">What's your goal with personal branding?</label>
                <input
                  className="field-input"
                  placeholder="e.g. Land a senior role in the next 6 months"
                  value={form.goal}
                  onChange={(e) => updateForm("goal", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Paste LinkedIn About */}
        {step === 2 && (
          <div className="mt-10">
            <h1 className="font-display text-3xl leading-snug">
              Paste your current LinkedIn About section
            </h1>
            <p className="mt-3 text-sm text-muted">
              Optional — if you have one, it helps the AI understand your current voice. Skip if not.
            </p>
            <textarea
              rows={8}
              className="field-input mt-6 resize-none"
              placeholder="Paste your headline and About text here..."
              value={form.linkedinAbout}
              onChange={(e) => updateForm("linkedinAbout", e.target.value)}
            />
          </div>
        )}

        {/* STEP 3 — Text prompts */}
        {step === 3 && (
          <div className="mt-10">
            <h1 className="font-display text-3xl leading-snug">A couple more things</h1>
            <div className="mt-8 space-y-6">
              <div>
                <label className="field-label">Describe a project you're proud of</label>
                <textarea
                  rows={3}
                  className="field-input mt-2 resize-none"
                  placeholder="e.g. Led our migration to Kubernetes, cut deploy time by 60%"
                  value={form.proudProject}
                  onChange={(e) => updateForm("proudProject", e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">How do you want to be known?</label>
                <textarea
                  rows={3}
                  className="field-input mt-2 resize-none"
                  placeholder="e.g. The engineer who makes complex systems feel simple"
                  value={form.wantToBeKnownAs}
                  onChange={(e) => updateForm("wantToBeKnownAs", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Positioning quiz */}
        {step === 4 && (
          <div className="mt-10">
            <h1 className="font-display text-3xl leading-snug">Quick positioning quiz</h1>
            <div className="mt-8 space-y-8">
              {QUIZ_QUESTIONS.map((q) => (
                <div key={q.key}>
                  <p className="field-label">{q.question}</p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateQuiz(q.key, opt.value)}
                        className={`block w-full border px-4 py-3 text-left text-sm ${
                          quizAnswers[q.key] === opt.value
                            ? "border-ink bg-ink text-paper"
                            : "border-line text-ink/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5 — Generate */}
        {step === 5 && (
          <div className="mt-10">
            <h1 className="font-display text-3xl leading-snug">Ready to generate your Brand Brief</h1>
            <p className="mt-4 text-sm text-ink/70">
              We'll use everything you shared to build your positioning, tone, target audience,
              mission, and content pillars. You'll be able to edit it afterward.
            </p>
            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={goBack}
            className="font-mono text-xs uppercase tracking-widest text-muted disabled:opacity-0"
          >
            Back
          </button>

          {step < 5 ? (
            <button
              type="button"
              disabled={!stepIsValid()}
              onClick={goNext}
              className="btn-primary disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleGenerate}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? "Generating your brief…" : "Generate my Brand Brief"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;