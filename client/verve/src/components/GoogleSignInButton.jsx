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

  useEffect(() => {
    if (!ready || !CLIENT_ID || !containerRef.current) return undefined;

    let cancelled = false;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async ({ credential }) => {
        try {
          const { isNewUser } = await loginWithGoogle(credential);
          if (!cancelled) onSuccess?.(isNewUser);
        } catch (err) {
          if (!cancelled) onError?.(err.response?.data?.message || "Couldn't sign in with Google. Please try again.");
        }
      },
    });

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

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, theme]);

  if (!CLIENT_ID) return null;

  return <div ref={containerRef} className="flex w-full justify-center" />;
};

export default GoogleSignInButton;
