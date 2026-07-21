import { Link } from "react-router-dom";

const pillars = [
  {
    label: "Brand Brief",
    copy: "Answer a short intake. The AI turns it into a positioning statement, tone, and content pillars you can actually use.",
  },
  {
    label: "Content Studio",
    copy: "Generate LinkedIn posts, Instagram captions, and threads that sound like you — not like generic AI copy.",
  },
  {
    label: "Weekly Planner",
    copy: "Slot generated drafts onto a calendar so you post consistently without staring at a blank page.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <span className="font-display text-lg font-medium tracking-tight">BrandPilot</span>
        <nav className="flex items-center gap-6">
          <Link to="/login" className="font-mono text-xs uppercase tracking-widest text-ink hover:text-cobalt">
            Log in
          </Link>
          <Link to="/signup" className="btn-primary">
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="border-t border-line py-16">
          <p className="byline">Issue 01 — Personal Branding, Automated</p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-light leading-[1.1] tracking-tight sm:text-6xl">
            Become the headline
            <br />
            of your own industry.
          </h1>
          <p className="mt-6 max-w-xl font-body text-lg text-ink/80">
            BrandPilot AI studies who you are, then runs the branding agency you couldn't
            afford — building your positioning, writing your posts, and keeping you
            consistent, one week at a time.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link to="/signup" className="btn-primary">
              Build my brand brief
            </Link>
            <Link to="/login" className="btn-secondary">
              I already have an account
            </Link>
          </div>
        </section>

        <section className="grid gap-0 border-t border-line sm:grid-cols-3">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.label}
              className="border-b border-line py-10 pr-8 sm:border-b-0 sm:border-r sm:last:border-r-0"
            >
              <p className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 font-display text-2xl">{pillar.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{pillar.copy}</p>
            </div>
          ))}
        </section>

        <section className="border-t border-line py-16">
          <p className="byline">Why now</p>
          <p className="mt-6 max-w-2xl font-display text-2xl font-light leading-snug">
            Branding agencies charge thousands. Most professionals can't afford one —
            so their expertise stays invisible. BrandPilot gives you the same strategy,
            for a monthly subscription instead of a retainer.
          </p>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl border-t border-line px-6 py-8">
        <p className="byline">BrandPilot AI — built for people, not brands</p>
      </footer>
    </div>
  );
};

export default Landing;