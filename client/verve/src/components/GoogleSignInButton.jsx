import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Waits for the Identity Services script (loaded in index.html) to finish setting up
// window.google.accounts.id — it's tagged async/defer, so it isn't guaranteed to exist yet on
// first render. Polls rather than relying on a load event because index.html doesn't have a
// convenient hook to fire one into React from.
const useGoogleIdentity = () => {
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!window.google?.accounts?.id);

  useEffect(() => {
    if (ready) return undefined;
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        setReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [ready]);

  return ready;
};

// Renders Google's own hosted button (inside a cross-origin iframe, so it can't be restyled
// with CSS — theme/shape/size are the only knobs Identity Services exposes) and forwards a
// successful sign-in to AuthContext.loginWithGoogle. Renders nothing at all when
// VITE_GOOGLE_CLIENT_ID isn't configured, rather than showing a broken button.
const GoogleSignInButton = ({ onSuccess, onError }) => {
  const { loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const ready = useGoogleIdentity();
  const containerRef = useRef(null);

  // GIS `initialize` binds a single callback closure for the life of the widget, but the
  // props/context it needs can change between renders — keep the current ones in a ref so
  // the one-time callback always reads fresh values instead of a stale first-render capture.
  const handlersRef = useRef({ loginWithGoogle, onSuccess, onError });
  useEffect(() => {
    handlersRef.current = { loginWithGoogle, onSuccess, onError };
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!ready || !CLIENT_ID || !containerRef.current) return;

    // initialize() is idempotent-ish but re-running it on every theme toggle is wasteful and
    // can briefly double-render the button — do it once, then only re-render on theme change.
    if (!initializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          const { loginWithGoogle, onSuccess, onError } = handlersRef.current;
          try {
            const { needsOnboarding } = await loginWithGoogle(credential);
            onSuccess?.(needsOnboarding);
          } catch (err) {
            onError?.(err.response?.data?.message || "Couldn't sign in with Google. Please try again.");
          }
        },
      });
      initializedRef.current = true;
    }

    const width = Math.min(400, containerRef.current.offsetWidth || 400);
    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: theme === "dark" ? "filled_black" : "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "left",
      width,
    });
  }, [ready, theme]);

  if (!CLIENT_ID) return null;

  return <div ref={containerRef} className="flex w-full justify-center" />;
};

export default GoogleSignInButton;
