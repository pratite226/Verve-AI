import { useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../components/Reveal.jsx";

const services = [
  {
    num: "01",
    tag: "Strategy",
    title: "Brand Brief",
    sub: "(and why a positioning line beats a job title)",
    copy: "Answer a short intake. The AI turns it into a positioning statement, a tone of voice, a target audience and the content pillars everything else is generated from.",
    cta: "See the intake",
    to: "/onboarding",
  },
  {
    num: "02",
    tag: "Production",
    title: "Content Studio",
    sub: "(clarity converts better than cleverness)",
    copy: "Generate LinkedIn posts, Instagram captions and threads that sound like you. Refine any draft — shorten it, add a hook, add a CTA — without leaving the page.",
    cta: "Open the studio",
    to: "/content-studio",
  },
  {
    num: "03",
    tag: "Consistency",
    title: "Weekly Planner",
    sub: "(the whole game is showing up every week)",
    copy: "Drag drafts onto a calendar, or let the AI plan the week from your pillar weights. You stop staring at a blank page on a Monday morning.",
    cta: "See the planner",
    to: "/planner",
  },
];

const quotes = [
  {
    text: "I had eleven half-written drafts in my notes app for a year. BrandPilot turned them into a month of posts in an afternoon, and they still sound like me.",
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

const Landing = () => {
  const [quote, setQuote] = useState(0);

  const nextQuote = () => setQuote((q) => (q + 1) % quotes.length);
  const prevQuote = () => setQuote((q) => (q - 1 + quotes.length) % quotes.length);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-paper/72 px-10 py-[22px] backdrop-blur-md">
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-[17px] font-extrabold tracking-tight">BRANDPILOT</span>
          <span className="font-mono text-[10px] tracking-[0.22em] text-muted">AI</span>
        </div>
        <nav className="flex items-center gap-7">
          <Link
            to="/login"
            data-magnetic
            className="font-mono text-[11px] uppercase tracking-[0.22em]"
          >
            Log in
          </Link>
          <Link to="/signup" data-magnetic className="btn-primary">
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-[1440px] px-10 pb-14 pt-20">
        <Reveal className="byline">
          <span>Issue 01 — Personal branding, automated</span>
        </Reveal>
        <Reveal delay={80}>
          <h1
            className="mt-8 font-display font-extrabold tracking-[-0.045em]"
            style={{ fontSize: "clamp(56px,10.5vw,168px)", lineHeight: 0.88 }}
          >
            BECOME THE
            <br />
            <span className="italic font-bold" style={{ color: "var(--color-cobalt)" }}>
              HEADLINE
            </span>{" "}
            OF YOUR
            <br />
            OWN INDUSTRY.
          </h1>
        </Reveal>
        <div className="mt-14 grid gap-12 sm:grid-cols-2">
          <Reveal delay={160}>
            <p className="max-w-[520px] text-lg leading-relaxed text-muted">
              BrandPilot studies who you are, then runs the branding agency you couldn't afford
              — building your positioning, writing your posts, and keeping you consistent, one
              week at a time.
            </p>
          </Reveal>
          <Reveal delay={220} className="flex flex-wrap justify-end gap-3">
            <Link to="/onboarding" data-magnetic className="btn-primary">
              Build my brand brief
            </Link>
            <Link to="/login" data-magnetic className="btn-secondary">
              I already have an account
            </Link>
          </Reveal>
        </div>
      </section>

      <div className="overflow-hidden border-y border-line bg-paper-raised py-[18px]">
        <div className="flex w-max animate-[marquee_34s_linear_infinite]">
          {[0, 1].map((rep) => (
            <div
              key={rep}
              className="flex items-center gap-10 whitespace-nowrap pr-10 font-mono text-xs uppercase tracking-[0.24em] text-muted"
            >
              {tickerItems.map((item) => (
                <span key={item} className="flex items-center gap-10">
                  {item}
                  <span style={{ color: "var(--color-cobalt)" }}>✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-[1440px] px-10 pt-24">
        <Reveal className="flex flex-wrap items-baseline justify-between gap-6">
          <h2
            className="m-0 font-display font-extrabold tracking-[-0.04em]"
            style={{ fontSize: "clamp(34px,4.4vw,64px)" }}
          >
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
              delay={i * 90}
              className="grid items-center gap-10 rounded border border-line bg-paper-raised p-9 pl-10 transition-colors duration-200 hover:border-[var(--color-cobalt)]"
              style={{ gridTemplateColumns: "1fr 300px" }}
            >
              <div>
                <div className="flex items-center gap-3.5">
                  <span className="font-mono text-[11px] tracking-[0.22em]" style={{ color: "var(--color-cobalt)" }}>
                    {s.num}
                  </span>
                  <span className="h-px w-7 bg-line" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{s.tag}</span>
                </div>
                <h3
                  className="mt-4 font-display font-bold leading-[1.05] tracking-[-0.035em]"
                  style={{ fontSize: "clamp(28px,3.2vw,44px)" }}
                >
                  {s.title}
                </h3>
                <p className="mt-3 text-base italic text-[#8A867E]">{s.sub}</p>
                <p className="mt-5 max-w-[620px] text-base leading-relaxed text-muted">{s.copy}</p>
                <Link to={s.to} className="btn-secondary mt-6 inline-flex">
                  {s.cta}
                </Link>
              </div>
              <div
                className="flex h-[210px] items-end rounded-sm border border-line p-3.5"
                style={{
                  backgroundColor: "#0E0E11",
                  backgroundImage:
                    "repeating-linear-gradient(135deg,#141417 0 8px,#0E0E11 8px 16px)",
                }}
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#4A4A50]">
                  {s.title} preview
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-10 pt-24">
        <Reveal className="rounded border border-line bg-paper-raised p-12">
          <div className="flex items-center justify-between gap-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              What our users say
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-[#6E6A63]">
                {quote + 1} / {quotes.length}
              </span>
              <button
                type="button"
                onClick={prevQuote}
                className="btn-secondary h-[38px] w-[38px] rounded-full p-0"
              >
                ←
              </button>
              <button
                type="button"
                onClick={nextQuote}
                className="btn-secondary h-[38px] w-[38px] rounded-full p-0"
              >
                →
              </button>
            </div>
          </div>
          <p
            className="mt-8 max-w-[1020px] font-display leading-[1.28] tracking-[-0.025em]"
            style={{ fontSize: "clamp(22px,2.7vw,38px)" }}
          >
            {quotes[quote].text}
          </p>
          <div className="mt-8 flex items-center gap-3.5">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line font-mono text-xs"
              style={{ background: "#16180F", color: "var(--color-cobalt)" }}
            >
              {quotes[quote].initials}
            </span>
            <div>
              <div className="text-[15px] font-semibold">{quotes[quote].name}</div>
              <div className="mt-0.5 text-[13px] text-muted">{quotes[quote].role}</div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1440px] border-t border-line px-10 py-24">
        <Reveal className="byline">
          <span>Why now</span>
        </Reveal>
        <Reveal
          delay={100}
          as="p"
          className="mt-8 max-w-[1000px] font-display font-normal leading-[1.14] tracking-[-0.035em]"
          style={{ fontSize: "clamp(28px,4vw,56px)" }}
        >
          Branding agencies charge thousands. Most professionals can't afford one — so their
          expertise stays{" "}
          <span className="italic" style={{ color: "var(--color-cobalt)" }}>
            invisible
          </span>
          . BrandPilot gives you the same strategy, for a subscription instead of a retainer.
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1440px] px-10 pb-24">
        <Reveal>
          <h2
            className="m-0 font-display font-extrabold tracking-[-0.04em]"
            style={{ fontSize: "clamp(34px,4.4vw,64px)" }}
          >
            Ready to start?
          </h2>
          <p className="mt-3.5 text-[17px] text-[#8A867E]">Choose how you'd like to begin.</p>
        </Reveal>
        <div className="mt-9 grid gap-3.5 sm:grid-cols-2">
          <Reveal
            as={Link}
            to="/onboarding"
            data-magnetic
            className="flex min-h-[230px] flex-col justify-between gap-3.5 rounded border p-10 text-left transition-colors duration-200 hover:border-[var(--color-cobalt)]"
            style={{ borderColor: "var(--color-cobalt)", background: "var(--color-cobalt)", color: "var(--color-paper)" }}
          >
            <div>
              <div className="font-bold tracking-[-0.035em]" style={{ fontSize: "clamp(26px,2.8vw,38px)" }}>
                Build my brief
              </div>
              <p className="mt-3.5 max-w-[420px] text-base leading-relaxed" style={{ color: "rgba(8,8,10,.7)" }}>
                Answer the intake and the AI writes your positioning, tone, audience and pillars.
                Edit anything afterward.
              </p>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Ten minutes →</span>
          </Reveal>
          <Reveal
            as={Link}
            to="/login"
            data-magnetic
            className="flex min-h-[230px] flex-col justify-between gap-3.5 rounded border border-line bg-paper-raised p-10 text-left text-ink transition-colors duration-200 hover:border-[var(--color-cobalt)]"
          >
            <div>
              <div className="font-bold tracking-[-0.035em]" style={{ fontSize: "clamp(26px,2.8vw,38px)" }}>
                I already have an account
              </div>
              <p className="mt-3.5 max-w-[420px] text-base leading-relaxed text-muted">
                Pick up where you left off — your brief, drafts and next week are all where you
                left them.
              </p>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Log in →</span>
          </Reveal>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-10 py-8 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
        <span>BrandPilot AI — built for people, not brands</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
};

export default Landing;
