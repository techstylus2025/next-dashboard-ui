"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
var adapter_pg_1 = require("@prisma/adapter-pg");
var client_1 = require("@prisma/client");
var prismaClientSingleton = function () {
    var connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL environment variable not set");
    }
    var pool = new pg_1.Pool({ connectionString: connectionString });
    var adapter = new adapter_pg_1.PrismaPg(pool);
    // Cast so TS sees all generated models (adapter constructor narrows the type)
    return new client_1.PrismaClient({ adapter: adapter });
};
function getPrisma() {
    var cached = globalThis.prismaGlobal;
    if (cached) {
        return cached;
    }
    var client = prismaClientSingleton();
    if (process.env.NODE_ENV !== "production") {
        globalThis.prismaGlobal = client;
    }
    return client;
}
var prisma = getPrisma();
exports.default = prisma;
