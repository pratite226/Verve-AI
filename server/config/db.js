const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed");
        console.error(error.message);

        if (process.env.NODE_ENV !== "production") {
            console.error("Allow your current IP address in MongoDB Atlas Network Access, or temporarily use 0.0.0.0/0.");
        }
    }
};

module.exports = connectDB;