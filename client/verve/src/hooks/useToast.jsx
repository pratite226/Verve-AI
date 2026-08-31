import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext(null);

// Each toast schedules its own auto-dismiss via setTimeout — a macrotask queued on the
// event loop, so it fires after the current call stack and any pending microtasks (state
// updates, promise callbacks) have finished, not immediately.
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  // Timers are tracked outside React state (a ref, not state) because they're an
  // imperative side effect, not something that should trigger a re-render.
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, { type = "info", duration = 3500 } = {}) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);

      // Captures `id` in this call's closure, so the timeout fires for *this* toast only —
      // each call gets its own timer even though they all share the same `dismiss` function.
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  // Without this, a toast's setTimeout could still fire after the component (and the page
  // that triggered it) has unmounted, calling setState on an unmounted tree.
  useEffect(() => {
    const timerMap = timers.current;
    return () => {
      timerMap.forEach(clearTimeout);
      timerMap.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto cursor-pointer rounded-xl border px-4 py-3 text-sm shadow-sm ${
              t.type === "error"
                ? "border-danger-bd bg-danger-bg text-danger"
                : "border-bd bg-panel text-text"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};
