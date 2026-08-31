// debounce closes over `timer` across calls — each invocation reads/writes the same
// variable from the enclosing scope, which is what lets a later call cancel an earlier
// one's pending setTimeout instead of every call getting its own independent timer.
export const debounce = (fn, delayMs) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
};

// FileReader's native API is callback-based (onload/onerror), not promise-based — this
// wraps it in a Promise so upload flows can just `await` a data URL instead of nesting
// callbacks, the same shape as the axios calls the rest of the app already uses.
export const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

// Coalesces bursts of calls into a single invocation of `fn`, deferred to a microtask.
// Real motivation: multi-platform generation and weekly-plan generation each emit one
// `draft:created` socket event per draft they create (contentController.js), so a single
// action can fire several events back-to-back. Without this, every event would independently
// call `fn` (e.g. re-fetching the draft list), spraying one redundant network request per
// extra draft. `queueMicrotask` callbacks run as microtasks, and the event loop always drains
// the entire microtask queue before it processes the next macrotask — so every event handler
// invoked within the same tick (or the same batch of already-queued socket messages) has a
// chance to set the pending flag before the deferred call actually runs `fn`, collapsing the
// whole burst into one call.
export const coalesceMicrotask = (fn) => {
  let pending = false;
  return () => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
      pending = false;
      fn();
    });
  };
};

// Retries an idempotent request (GET only — never wrap a POST/PUT with this, a retried
// write could double-apply) with exponential backoff, for transient failures like a dropped
// connection or a 502 from a cold server.
//
// `attempt()` is called here, above the line where it's defined below — that only works
// because `function` declarations are hoisted with their full body attached to the binding,
// not just the name (unlike `const`/`let`, which hoist the binding but leave it in the
// temporal dead zone until their declaration line runs). Writing the entry point first and
// its recursive helper after is the actual point of relying on that: a reader meets the
// public shape of the utility before its retry bookkeeping.
export const retryWithBackoff = (fn, { retries = 2, baseDelayMs = 400 } = {}) =>
  attempt(fn, retries, baseDelayMs, 0);

function attempt(fn, retries, baseDelayMs, attemptIndex) {
  return fn().catch((error) => {
    const status = error?.response?.status;
    const isRetryable = !status || status >= 500;
    if (!isRetryable || attemptIndex >= retries) throw error;

    const delay = baseDelayMs * 2 ** attemptIndex;
    return new Promise((resolve) => setTimeout(resolve, delay)).then(() =>
      attempt(fn, retries, baseDelayMs, attemptIndex + 1)
    );
  });
}
