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
