import { config } from "dotenv";
import { spawn } from "child_process";

config({ path: ".env.production" });

const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) throw new Error("DATABASE_URL not set");

const url = new URL(baseUrl);
url.pathname = "/nhwhq_staging";
const previewDatabaseUrl = url.toString();

const child = spawn("npx", [
  "vercel",
  "--token",
  process.env.VERCEL_TOKEN,
  "--non-interactive",
  "env",
  "add",
  "DATABASE_URL",
  "preview",
  "--value",
  previewDatabaseUrl,
  "--yes",
], { stdio: "inherit" });

child.on("exit", (code) => process.exit(code ?? 0));
