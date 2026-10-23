import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function getDatabaseConfig(): { url?: string } {
  // If running in a serverless environment (Vercel / AWS Lambda), use writable /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = path.join("/tmp", "dev.db");

    if (!fs.existsSync(tmpDbPath)) {
      const sourceDb = path.join(process.cwd(), "prisma", "dev.db");
      if (fs.existsSync(sourceDb)) {
        try {
          fs.copyFileSync(sourceDb, tmpDbPath);
        } catch (err) {
          console.error("Failed to copy database to /tmp:", err);
        }
      }
    }

    if (fs.existsSync(tmpDbPath)) {
      const sqliteUrl = `file:${tmpDbPath}`;
      process.env.DATABASE_URL = sqliteUrl;
      return { url: sqliteUrl };
    }
  }

  return {};
}

const dbConfig = getDatabaseConfig();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(dbConfig.url
      ? {
          datasources: {
            db: {
              url: dbConfig.url,
            },
          },
        }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
