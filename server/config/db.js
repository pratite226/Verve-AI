const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        console.log("MongoDB Connected Successfully");

        // Post-connection lifecycle logging — the initial connect above only covers the first
        // handshake; these surface later drops/recoveries (Atlas failover, idle socket
        // timeout, network blip) that would otherwise only show up as scattered request 500s.
        mongoose.connection.on("error", (err) =>
            console.error("MongoDB error:", err.message)
        );
        mongoose.connection.on("disconnected", () =>
            console.warn("MongoDB disconnected")
        );
        mongoose.connection.on("reconnected", () =>
            console.log("MongoDB reconnected")
        );
    } catch (error) {
        console.error("MongoDB Connection Failed");
        console.error(error.message);

        if (process.env.NODE_ENV !== "production") {
            console.error("Allow your current IP address in MongoDB Atlas Network Access, or temporarily use 0.0.0.0/0.");
        }

        // Mongo is the primary datastore — nearly every route needs it (auth middleware hits
        // it on every protected request). Exit non-zero so the orchestrator restarts the
        // process instead of it serving traffic that buffers for 10s then 500s.
        process.exit(1);
    }
}

module.exports = connectDB;
