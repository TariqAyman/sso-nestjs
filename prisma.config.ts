import path from "node:path";
import dotenv from "dotenv";
import type { PrismaConfig } from "prisma";

// Load environment variables from .env file
dotenv.config();

export default {
  schema: path.join("prisma", "schema"),
} satisfies PrismaConfig;
