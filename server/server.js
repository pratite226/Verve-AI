const express = require("express");
const http = require("http");
const fs = require("fs");
const { pathToFileURL } = require("url");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const helmet = require("helmet");
const mongoose = require("mongoose");

// Local dev reads config from the repo-root .env. In Docker/Render the file isn't present in
// the image — env comes from the platform (compose `env_file`/`environment`, Render's
// dashboard) — so a missing file here is expected, not an error. `quiet` suppresses dotenv
// v17's startup promo/tip line.
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const validateEnv = require("./utils/validateEnv");
validateEnv();

const connectDB = require("./config/db");
const prisma = require("./config/prisma");
const repairUserIndexes = require("./config/repairIndexes");
const authRoutes = require("./routes/authRoutes");
const brandRoutes = require("./routes/brandRoutes");
const contentRoutes = require("./routes/contentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const canvasRoutes = require("./routes/canvasRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const billingRoutes = require("./routes/billingRoutes");
const { handleWebhook } = require("./controllers/billingController");
const { startJobs } = require("./jobs");
const errorMiddleware = require("./middleware/errorMiddleware");
const sanitizeInputs = require("./middleware/sanitizeMiddleware");
const { initSocket } = require("./services/socketService");

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());

// Stripe webhook needs the raw request body to verify its signature, so it's mounted
// before express.json() parses everything else into an object.
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), handleWebhook);

app.use(express.json());

// helmet()'s default Cross-Origin-Resource-Policy: same-origin (set globally above) blocks
// the browser from rendering these files at all when loaded from a different origin than
// this server — which is the normal case here: the client runs on its own origin in dev
// (Vite on :5173 vs this server on :5000) and in the split static-deploy setup this app
// supports (see the SPA-fallback comment below). Canvas image notes render via a plain
// `<img src>` pointing at this exact path, so without this override every uploaded image
// would silently fail to load anywhere except a same-origin deployment.
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.resolve(__dirname, "uploads"))
);

// NoSQL operator injection awareness — see middleware/sanitizeMiddleware.js.
app.use(sanitizeInputs);

// Scoped SSR (see LLD.md §7 / entry-server.jsx): only "/" — the static Landing page — is
// server-rendered, and only when the client has actually been built (`npm run build:all` in
// client/verve). Everything else stays the plain client-rendered SPA. This keeps the
// feature purely additive: without a build present, "/" falls back to today's plain-text
// response and no other route's behavior changes at all.
const CLIENT_DIST_DIR = path.resolve(__dirname, "../client/verve/dist");
const SSR_ENTRY_PATH = path.resolve(__dirname, "../client/verve/dist-ssr/entry-server.js");
const clientBuildAvailable = fs.existsSync(path.join(CLIENT_DIST_DIR, "index.html"));
const ssrBuildAvailable = clientBuildAvailable && fs.existsSync(SSR_ENTRY_PATH);

if (ssrBuildAvailable) {
    app.get("/", async (req, res, next) => {
        try {
            // Vite's SSR build output is ESM — dynamic import() (not require()) loads it
            // regardless of Node version, unlike require(esm) which is newer/less portable.
            const { render } = await import(pathToFileURL(SSR_ENTRY_PATH).href);
            const appHtml = render("/");
            const template = fs.readFileSync(path.join(CLIENT_DIST_DIR, "index.html"), "utf-8");
            const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
            res.status(200).set({ "Content-Type": "text/html" }).send(html);
        } catch (err) {
            next(err);
        }
    });
} else {
    app.get("/", (req, res) => {
        res.send("Server Running Successfully");
    });
}

// Used by docker-compose healthchecks and CI — deliberately doesn't touch Mongo/Postgres,
// so it reports "the process is alive" independent of downstream DB availability.
app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true, status: "ok", uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/canvas", canvasRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/billing", billingRoutes);

if (clientBuildAvailable) {
    // index:false — "/" is handled above (SSR'd or plain-text) so static serving shouldn't
    // also hand back the raw index.html for that exact path.
    app.use(express.static(CLIENT_DIST_DIR, { index: false }));

    // SPA fallback: any GET that isn't /api/* or /uploads/* and didn't match a static file
    // above is a client-side route (e.g. /dashboard) — hand back index.html and let
    // React Router take over, same as the vercel.json rewrite does for a separate static
    // deploy of the client.
    app.get(/^\/(?!api|uploads).*/, (req, res) => {
        res.sendFile(path.join(CLIENT_DIST_DIR, "index.html"));
    });
}

app.use(errorMiddleware);

// Nothing above needs a database connection (route handlers do, but they only run after a
// request arrives). Serve traffic only once Mongo is actually connected — connectDB() exits
// the process on failure, so reaching the next line means the connection is live.
const start = async () => {
    await connectDB();
    await repairUserIndexes();

    initSocket(httpServer);

    httpServer.listen(PORT, () => {
        console.log(`Server Running Successfully`);
        console.log(`Port : ${PORT}`);
    });

    startJobs();
};

const shutdown = async (signal) => {
    console.log(`${signal} received — shutting down`);
    httpServer.close();
    await Promise.allSettled([mongoose.disconnect(), prisma.$disconnect()]);
    process.exit(0);
};

["SIGTERM", "SIGINT"].forEach((signal) =>
    process.on(signal, () => shutdown(signal))
);

start();