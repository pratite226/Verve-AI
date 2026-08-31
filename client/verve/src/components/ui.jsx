// Shared Verve design-system primitives. Screens compose these plus Tailwind layout utilities
// instead of writing verve-* class names or raw var(--color-*) styling directly — keeps every
// screen's colors, radii and type routed through the token stylesheet (src/index.css).

export const Spinner = ({ className = "" }) => <span className={`verve-spinner ${className}`} aria-hidden="true" />;

export const Button = ({
  as: Component = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  type,
  ...props
}) => {
  const variantClass = variant === "ghost" ? "verve-btn-ghost" : "verve-btn-primary";
  const sizeClass = size === "sm" ? "verve-btn-sm" : "";
  const isButtonTag = Component === "button";

  return (
    <Component
      type={isButtonTag ? type || "button" : undefined}
      disabled={isButtonTag ? disabled || loading : undefined}
      aria-disabled={!isButtonTag && (disabled || loading) ? "true" : undefined}
      className={`verve-btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </Component>
  );
};

export const Chip = ({ active = false, className = "", children, ...props }) => (
  <button type="button" aria-pressed={active} className={`verve-chip ${className}`} {...props}>
    {children}
  </button>
);

export const Field = ({ label, id, as: Tag = "input", className = "", inputClassName = "", ...props }) => (
  <div className={className}>
    {label && (
      <label htmlFor={id} className="verve-field-label">
        {label}
      </label>
    )}
    <Tag id={id} className={`verve-field ${label ? "mt-2.5" : ""} ${inputClassName}`} {...props} />
  </div>
);

export const Textarea = ({ label, id, className = "", inputClassName = "", ...props }) => (
  <div className={className}>
    {label && (
      <label htmlFor={id} className="verve-field-label">
        {label}
      </label>
    )}
    <textarea id={id} className={`verve-textarea ${label ? "mt-2.5" : ""} ${inputClassName}`} {...props} />
  </div>
);

export const Select = ({ label, id, className = "", children, ...props }) => (
  <div className={className}>
    {label && (
      <label htmlFor={id} className="verve-field-label mb-2.5 block">
        {label}
      </label>
    )}
    <select id={id} className="verve-select" {...props}>
      {children}
    </select>
  </div>
);

export const Alert = ({ children, onRetry, retryLabel = "Retry", className = "" }) => (
  <div className={`verve-alert ${className}`}>
    <span>{children}</span>
    {onRetry && (
      <Button
        variant="ghost"
        size="sm"
        onClick={onRetry}
        className="shrink-0"
        style={{ borderColor: "var(--color-danger-bd)", color: "var(--color-danger)" }}
      >
        {retryLabel}
      </Button>
    )}
  </div>
);

export const EmptyState = ({ label, children, action, className = "" }) => (
  <div className={`verve-empty ${className}`}>
    {label && <div className="verve-label">{label}</div>}
    {children && <p className="mx-auto mt-4 max-w-[420px] text-base leading-relaxed text-muted">{children}</p>}
    {action && <div className="mt-6 flex justify-center">{action}</div>}
  </div>
);

export const Skeleton = ({ className = "", style }) => <div className={`verve-skeleton ${className}`} style={style} />;

const STATUS_META = {
  draft: { label: "Draft", data: "draft" },
  scheduled: { label: "Planned", data: "planned" },
  posted: { label: "Published", data: "published" },
};

export const StatusPill = ({ status, className = "" }) => {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={`verve-status-pill ${className}`} data-status={meta.data}>
      {meta.label}
    </span>
  );
};

export const KpiCard = ({ label, value, qualifier, qualifierTone = "ok", className = "" }) => (
  <div className={`verve-kpi ${className}`}>
    <div className="verve-label">{label}</div>
    <div className="mt-3 flex items-baseline gap-2">
      <span className="text-[26px] font-extrabold leading-none tracking-[-0.035em] text-head">{value}</span>
      {qualifier && (
        <span
          className="text-xs font-semibold"
          style={{ color: qualifierTone === "danger" ? "var(--color-danger)" : "var(--color-ok)" }}
        >
          {qualifier}
        </span>
      )}
    </div>
  </div>
);
