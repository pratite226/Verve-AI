import { useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Logo from "../components/Logo.jsx";
import { Button } from "../components/ui.jsx";

const services = [
  {
    num: "01",
    tag: "Strategy",
    title: "Brand Brief",
    sub: "(and why a positioning line beats a job title)",
    copy: "Answer a short intake. The AI turns it into a positioning statement, a tone of voice, a target audience and the content pillars everything else is generated from.",
    cta: "See the intake",
    to: "/onboarding",
    mockup: "brief",
  },
  {
    num: "02",
    tag: "Production",
    title: "Content Studio",
    sub: "(clarity converts better than cleverness)",
    copy: "Generate LinkedIn posts, Instagram captions and threads that sound like you. Refine any draft — shorten it, add a hook, add a CTA — without leaving the page.",
    cta: "Open the studio",
    to: "/content-studio",
    mockup: "studio",
  },
  {
    num: "03",
    tag: "Consistency",
    title: "Weekly Planner",
    sub: "(the whole game is showing up every week)",
    copy: "Drag drafts onto a calendar, or let the AI plan the week from your pillar weights. You stop staring at a blank page on a Monday morning.",
    cta: "See the planner",
    to: "/planner",
    mockup: "planner",
  },
];

const quotes = [
  {
    text: "I had eleven half-written drafts in my notes app for a year. Verve turned them into a month of posts in an afternoon, and they still sound like me.",
    name: "Priya Nair",
    role: "Staff Engineer, Latch",
    initials: "PN",
  },
  {
    text: "The brief was the part I didn't know I needed. Once the positioning line existed, everything I wrote got easier — including the things I wrote outside the app.",
    name: "Tomás Herrera",
    role: "Founder, Fieldnote",
    initials: "TH",
  },
  {
    text: "I post three times a week now without dreading it. The planner does the deciding, which was always the expensive part for me.",
    name: "Ada Boateng",
    role: "Design Lead, Northwind",
    initials: "AB",
  },
];

const tickerItems = [
  "Positioning",
  "Tone of voice",
  "Content pillars",
  "LinkedIn",
  "Instagram",
  "Threads",
  "Weekly plan",
  "Profile makeover",
];

const ServiceMockup = ({ kind }) => {
  if (kind === "brief") {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-3.5 p-4">
        {["Positioning", "Tagline"].map((label) => (
          <div key={label} className="rounded-lg border border-bd bg-raised p-2.5">
            <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-faint">{label}</div>
            <div className="mt-1.5 h-1.5 w-4/5 rounded-full bg-bd-2" />
          </div>
        ))}
        <div className="mt-1 flex flex-col gap-1.5">
          {[70, 45, 25].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-hair">
                <div className="h-full rounded-full bg-accent" style={{ width: `${w}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "studio") {
    return (
      <div className="flex h-full w-full flex-col justify-center gap-4 p-4">
        <div className="flex gap-1.5">
          {["LinkedIn", "Instagram", "Threads"].map((p, i) => (
            <span
              key={p}
              className={`rounded-full px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] ${
                i === 0 ? "bg-accent text-on-accent" : "border border-bd-2 text-faint"
              }`}
            >
              {p}
            </span>
          ))}
        </div>
        <div className="rounded-lg border border-bd bg-raised p-3">
          <div className="h-1.5 w-full rounded-full bg-bd-2" />
          <div className="mt-1.5 h-1.5 w-4/5 rounded-full bg-bd-2" />
          <div className="mt-1.5 h-1.5 w-2/5 rounded-full bg-bd-2" />
          <span className="mt-1 inline-block h-3 w-[2px] animate-pulse bg-accent align-middle" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-7 gap-1 p-4">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="flex flex-col gap-1 rounded-md border border-bd bg-raised p-1">
          {[2, 4, 6].includes(i) && <div className="h-3 rounded-sm bg-tint" style={{ borderLeft: "2px solid var(--color-accent)" }} />}
        </div>
      ))}
    </div>
  );
};

const Landing = () => {
  const [quote, setQuote] = useState(0);

  const nextQuote = () => setQuote((q) => (q + 1) % quotes.length);
  const prevQuote = () => setQuote((q) => (q - 1 + quotes.length) % quotes.length);

  return (
    <div className="min-h-screen bg-bg text-text">
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-10 py-[22px]"
        style={{ backgroundColor: "var(--color-header-bg)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--color-hair)" }}
      >
        <Logo />
        <nav className="flex items-center gap-6">
          <ThemeToggle />
          <Link to="/login" className="font-mono text-[11px] uppercase tracking-[0.22em]">
            Log in
          </Link>
          <Button as={Link} to="/signup">
            Get started
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-[1440px] px-10 pb-14 pt-20">
        <Reveal className="verve-eyebrow">
          <span>Personal branding, automated</span>
        </Reveal>
        <Reveal delay={80}>
          <h1
            className="mt-8 font-extrabold tracking-[-0.045em] text-head"
            style={{ fontSize: "clamp(56px,10.5vw,168px)", lineHeight: 0.88, textWrap: "balance" }}
          >
            BECOME THE
            <br />
            <span className="font-serif italic font-normal text-accent">Headline</span> OF YOUR
            <br />
            OWN INDUSTRY.
          </h1>
        </Reveal>
        <div className="mt-14 grid gap-12 sm:grid-cols-2">
          <Reveal delay={160}>
            <p className="max-w-[520px] text-lg leading-relaxed text-muted">
              Verve studies who you are, then runs the branding agency you couldn't afford
              — building your positioning, writing your posts, and keeping you consistent, one
              week at a time.
            </p>
          </Reveal>
          <Reveal delay={220} className="flex flex-wrap justify-end gap-3">
            <Button as={Link} to="/onboarding">
              Build my brand brief
            </Button>
            <Button as={Link} to="/login" variant="ghost">
              I already have an account
            </Button>
          </Reveal>
        </div>
      </section>

      <div className="overflow-hidden border-y border-hair bg-panel py-[18px]">
        <div className="flex w-max animate-[marquee_34s_linear_infinite]">
          {[0, 1].map((rep) => (
            <div
              key={rep}
              className="flex items-center gap-10 whitespace-nowrap pr-10 font-mono text-xs uppercase tracking-[0.24em] text-muted"
            >
              {tickerItems.map((item) => (
                <span key={item} className="flex items-center gap-10">
                  {item}
                  <span className="text-accent">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-[1440px] px-10 pt-24">
        <Reveal className="flex flex-wrap items-baseline justify-between gap-6">
          <h2 className="m-0 font-extrabold tracking-[-0.04em] text-head" style={{ fontSize: "clamp(34px,4.4vw,64px)" }}>
            Our services
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Three of them. That's the whole product.
          </span>
        </Reveal>

        <div className="mt-10 flex flex-col gap-3.5">
          {services.map((s, i) => (
            <Reveal
              key={s.num}
              delay={i * 75}
              className="verve-card verve-card-interactive grid items-center gap-10 p-9 pl-10 sm:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]"
            >
              <div>
                <div className="flex items-center gap-3.5">
                  <span className="font-mono text-[11px] tracking-[0.22em] text-accent">{s.num}</span>
                  <span className="h-px w-7 bg-hair" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{s.tag}</span>
                </div>
                <h3 className="mt-4 font-bold leading-[1.05] tracking-[-0.035em] text-head" style={{ fontSize: "clamp(28px,3.2vw,44px)" }}>
                  {s.title}
                </h3>
                <p className="mt-3 font-serif text-lg italic text-label">{s.sub}</p>
                <p className="mt-5 max-w-[620px] text-base leading-relaxed text-muted">{s.copy}</p>
                <Button as={Link} to={s.to} variant="ghost" className="mt-6">
                  {s.cta}
                </Button>
              </div>
              <div className="h-[230px] overflow-hidden rounded-[14px] border border-bd bg-raised">
                <ServiceMockup kind={s.mockup} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] border-t border-hair px-10 py-24">
        <Reveal className="verve-eyebrow">
          <span>Why now</span>
        </Reveal>
        <Reveal
          delay={100}
          as="p"
          className="mt-8 max-w-[1000px] font-normal leading-[1.14] tracking-[-0.035em] text-head"
          style={{ fontSize: "clamp(28px,4vw,56px)" }}
        >
          Branding agencies charge thousands. Most professionals can't afford one — so their
          expertise stays <span className="font-serif italic text-accent">invisible</span>.
          Verve gives you the same strategy, for a subscription instead of a retainer.
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1440px] px-10 pt-24">
        <Reveal className="verve-card p-12">
          <div className="flex items-center justify-between gap-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">What our users say</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-muted">
                {quote + 1} / {quotes.length}
              </span>
              <button type="button" onClick={prevQuote} className="verve-btn verve-btn-ghost h-[38px] w-[38px] rounded-full p-0">
                ←
              </button>
              <button type="button" onClick={nextQuote} className="verve-btn verve-btn-ghost h-[38px] w-[38px] rounded-full p-0">
                →
              </button>
            </div>
          </div>
          <p className="mt-8 max-w-[1020px] leading-[1.28] tracking-[-0.025em] text-head" style={{ fontSize: "clamp(22px,2.7vw,38px)" }}>
            {quotes[quote].text}
          </p>
          <div className="mt-8 flex items-center gap-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-tint-bd bg-tint font-mono text-xs text-accent">
              {quotes[quote].initials}
            </span>
            <div>
              <div className="text-[15px] font-semibold text-head">{quotes[quote].name}</div>
              <div className="mt-0.5 text-[13px] text-muted">{quotes[quote].role}</div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1440px] px-10 pb-24 pt-24">
        <Reveal>
          <h2 className="m-0 font-extrabold tracking-[-0.04em] text-head" style={{ fontSize: "clamp(34px,4.4vw,64px)" }}>
            Ready to start?
          </h2>
          <p className="mt-3.5 text-[17px] text-label">Choose how you'd like to begin.</p>
        </Reveal>
        <div className="mt-9 grid gap-3.5 sm:grid-cols-2">
          <Reveal
            as={Link}
            to="/onboarding"
            className="flex min-h-[230px] flex-col justify-between gap-3.5 rounded-2xl border border-accent bg-accent p-10 text-left text-on-accent transition-opacity duration-200 hover:opacity-90"
          >
            <div>
              <div className="font-bold tracking-[-0.035em]" style={{ fontSize: "clamp(26px,2.8vw,38px)" }}>
                Build my brief
              </div>
              <p className="mt-3.5 max-w-[420px] text-base leading-relaxed" style={{ color: "rgba(255,255,255,.78)" }}>
                Answer the intake and the AI writes your positioning, tone, audience and pillars.
                Edit anything afterward.
              </p>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Ten minutes →</span>
          </Reveal>
          <Reveal
            as={Link}
            to="/login"
            className="verve-card verve-card-interactive flex min-h-[230px] flex-col justify-between gap-3.5 p-10 text-left"
          >
            <div>
              <div className="font-bold tracking-[-0.035em] text-head" style={{ fontSize: "clamp(26px,2.8vw,38px)" }}>
                I already have an account
              </div>
              <p className="mt-3.5 max-w-[420px] text-base leading-relaxed text-muted">
                Pick up where you left off — your brief, drafts and next week are all where you
                left them.
              </p>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">Log in →</span>
          </Reveal>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-hair px-10 py-8 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        <span>Verve AI — built for people, not brands</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
};

export default Landing;
