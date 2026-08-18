import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./hooks/useToast.jsx";

// Scoped SSR: only ever called by the server for "/" (see server/server.js), which routes
// to the static Landing page — no data fetching, so there's nothing async to await here.
// Renders the exact same provider tree as main.jsx (StaticRouter standing in for
// BrowserRouter) so the markup matches what the client hydrates onto — a shape mismatch
// between the two would make React discard the server HTML and re-render from scratch,
// defeating the point of SSR.
export const render = (url) =>
  renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </StaticRouter>
    </StrictMode>
  );
