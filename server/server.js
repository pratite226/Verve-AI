const express = require("express");
const http = require("http");
const fs = require("fs");
const { pathToFileURL } = require("url");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const helmet = require("helmet");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const validateEnv = require("./utils/validateEnv");
validateEnv();

const connectDB = require("./config/db");
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

// Connect MongoDB
connectDB();

app.use(cors());
app.use(helmet());

// Stripe webhook needs the raw request body to verify its signature, so it's mounted
// before express.json() parses everything else into an object.
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), handleWebhook);

app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

// NoSQL operator injection awareness — see middleware/sanitizeMiddleware.js.
app.use(sanitizeInputs);

// Scoped SSR (see LLD.md §7 / entry-server.jsx): only "/" — the static Landing page — is
// server-rendered, and only when the client has actually been built (`npm run build:all` in
// client/brandai). Everything else stays the plain client-rendered SPA. This keeps the
// feature purely additive: without a build present, "/" falls back to today's plain-text
// response and no other route's behavior changes at all.
const CLIENT_DIST_DIR = path.resolve(__dirname, "../client/brandai/dist");
const SSR_ENTRY_PATH = path.resolve(__dirname, "../client/brandai/dist-ssr/entry-server.js");
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

initSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server Running Successfully`);
    console.log(`Port : ${PORT}`);
});

startJobs();