import { Link } from "react-router-dom";
import Reveal from "../components/Reveal.jsx";

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
      <header className="sticky top-0 z-10 border-b border-line/0 bg-paper/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
          <span className="font-display text-lg font-medium tracking-tight">BrandPilot</span>
          <nav className="flex items-center gap-6">
            <Link
              to="/login"
              className="link-underline font-mono text-xs uppercase tracking-widest text-ink"
            >
              Log in
            </Link>
            <Link to="/signup" className="btn-primary">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="border-t border-line py-16 sm:py-24">
          <Reveal>
            <p className="byline">Issue 01 — Personal Branding, Automated</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-light leading-[1.1] tracking-tight sm:text-6xl">
              Become the{" "}
              <span className="relative whitespace-nowrap">
                headline
                <svg
                  className="absolute -bottom-2 left-0 w-full text-gold"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 8 C 50 2, 150 2, 198 8"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br />
              of your own industry.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-8 max-w-xl font-body text-lg text-ink/80">
              BrandPilot AI studies who you are, then runs the branding agency you couldn't
              afford — building your positioning, writing your posts, and keeping you
              consistent, one week at a time.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex items-center gap-4">
              <Link to="/signup" className="btn-primary">
                Build my brand brief
              </Link>
              <Link to="/login" className="btn-secondary">
                I already have an account
              </Link>
            </div>
          </Reveal>
        </section>

        <section className="grid gap-0 border-t border-line sm:grid-cols-3">
          {pillars.map((pillar, i) => (
            <Reveal
              key={pillar.label}
              delay={i * 100}
              className="group border-b border-line py-10 pr-8 transition-colors duration-300 hover:bg-paper-raised sm:border-b-0 sm:border-r sm:px-8 sm:first:pl-0 sm:last:border-r-0"
            >
              <p className="font-mono text-xs text-muted transition-colors duration-300 group-hover:text-cobalt">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-2xl transition-transform duration-300 group-hover:translate-x-1">
                {pillar.label}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{pillar.copy}</p>
            </Reveal>
          ))}
        </section>

        <section className="border-t border-line py-16 sm:py-24">
          <Reveal>
            <p className="byline">Why now</p>
          </Reveal>
          <Reveal delay={100}>
            <p className="relative mt-6 max-w-2xl font-display text-2xl font-light leading-snug sm:text-3xl">
              <span className="absolute -left-6 -top-4 font-display text-6xl text-gold/40" aria-hidden="true">
                "
              </span>
              Branding agencies charge thousands. Most professionals can't afford one —
              so their expertise stays invisible. BrandPilot gives you the same strategy,
              for a monthly subscription instead of a retainer.
            </p>
          </Reveal>
        </section>

        <section className="border-t border-line py-16 sm:py-24">
          <Reveal className="flex flex-col items-start justify-between gap-8 border border-line bg-paper-raised px-8 py-12 sm:flex-row sm:items-center">
            <div>
              <p className="byline">Ready when you are</p>
              <h2 className="mt-4 font-display text-3xl font-light">
                Your brand brief takes ten minutes to start.
              </h2>
            </div>
            <Link to="/signup" className="btn-primary shrink-0">
              Build my brand brief
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl border-t border-line px-6 py-8">
        <p className="byline">BrandPilot AI — built for people, not brands</p>
      </footer>
    </div>
  );
};

export default Landing;
