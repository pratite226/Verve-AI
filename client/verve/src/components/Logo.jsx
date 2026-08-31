// The mark is a single-stroke "V" drawn as a pen-nib gesture: a solid left limb (you) and a
// right limb at reduced opacity in --color-accent-2 (the AI) — two halves of one mark. It's
// inline SVG on a 64×64 viewBox so it themes automatically through the accent tokens instead
// of shipping as a raster asset.
const Mark = ({ size = 28, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path d="M10 7 L26 7 L34 52 L27 57 Z" fill="var(--color-accent)" />
    <path d="M54 7 L38 7 L30 52 L37 57 Z" fill="var(--color-accent-2)" opacity="0.6" />
  </svg>
);

const Wordmark = ({ ai = true, className = "" }) => (
  <span className={`inline-flex items-baseline gap-2 ${className}`}>
    <span className="font-sans text-[17px] font-extrabold uppercase tracking-[-0.03em] text-head">
      Verve
    </span>
    {ai && <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted">AI</span>}
  </span>
);

const Logo = ({ variant = "full", ai = true, size = 28, className = "" }) => {
  if (variant === "mark") return <Mark size={size} className={className} />;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark size={size} />
      <Wordmark ai={ai} />
    </span>
  );
};

export default Logo;
