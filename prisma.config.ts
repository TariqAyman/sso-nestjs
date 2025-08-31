// prisma.config.ts
import path from "node:path";
import { defineConfig } from "prisma/config";

// Load environment variables from .env file
import { config } from "dotenv";
config();

export default defineConfig({
  // You can target a folder (multi-file schema) or a single file.
  schema: path.join("prisma", "schema"), // or "prisma/models"
});
