import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = (): PrismaClient => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable not set");
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  // Cast so TS sees all generated models (adapter constructor narrows the type)
  return new PrismaClient({ adapter }) as PrismaClient;
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function getPrisma(): PrismaClient {
  const cached = globalThis.prismaGlobal;
  if (cached) {
    return cached;
  }
  const client = prismaClientSingleton();
  if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = client;
  }
  return client;
}

const prisma: PrismaClient = getPrisma();

export default prisma;
