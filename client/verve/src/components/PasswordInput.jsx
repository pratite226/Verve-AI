import { useState } from "react";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.07-6.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a20.4 20.4 0 0 1-3.22 4.6" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <path d="M1 1l22 22" />
  </svg>
);

// Toggles the input's own `type` between "password"/"text" rather than trying to fake the
// dot-mask with CSS — only a real type="password" input gets the browser's built-in masking
// (and its autofill/password-manager integration), so hiding/showing has to flip the actual
// attribute. Expects to be rendered inside a `position: relative` parent (both call sites use
// the existing `.field-shell` wrapper) so the toggle button can sit inside the field itself.
const PasswordInput = ({ id, className = "", ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <input id={id} type={visible ? "text" : "password"} className={`${className} pr-9`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-controls={id}
        className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center text-muted transition-colors hover:text-head"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </>
  );
};

export default PasswordInput;
