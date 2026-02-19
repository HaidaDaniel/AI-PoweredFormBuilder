import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Singleton pattern to avoid multiple PrismaClient instances during dev HMR
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

// @ts-expect-error - adapter is supported at runtime; generated client types (prisma-client-js) omit it
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Perform LLM startup check (non-blocking) — skip on Vercel (Ollama won't be available)
if (typeof globalThis !== "undefined" && process.env.VERCEL !== "1") {
  import("~/utils/llm-startup-check.server")
    .then((module) => module.performLLMStartupCheck())
    .catch((err) => {
      console.error("LLM startup check failed:", err);
    });
}


