import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const scope = globalThis as unknown as { flowDb?: PrismaClient };
export const db =
  scope.flowDb ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      ...(process.env.DATABASE_URL?.includes("127.0.0.1:5433")
        ? { max: 1 }
        : { max: 5 }),
    }),
  });
if (process.env.NODE_ENV !== "production") scope.flowDb = db;
