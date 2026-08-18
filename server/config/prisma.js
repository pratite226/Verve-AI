const { PrismaClient } = require("@prisma/client");

// Singleton client — mirrors the connect-once pattern in config/db.js for Mongo, so every
// controller shares one connection pool instead of opening a new one per require().
const prisma = new PrismaClient();

module.exports = prisma;
