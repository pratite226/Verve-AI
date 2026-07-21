const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const brandRoutes = require("./routes/brandRoutes");
const contentRoutes = require("./routes/contentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const canvasRoutes = require("./routes/canvasRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect MongoDB
connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server Running Successfully");
});

app.use("/api/auth", authRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/canvas", canvasRoutes);

app.listen(PORT, () => {
    console.log(`Server Running Successfully`);
    console.log(`Port : ${PORT}`);
});