import { config } from "dotenv";
import { spawnSync } from "child_process";

config({ path: ".env.production" });

const token = process.env.VERCEL_TOKEN;
if (!token) throw new Error("VERCEL_TOKEN not set");

function add(name, env, value) {
  const result = spawnSync("npx", [
    "vercel",
    "--token",
    token,
    "--non-interactive",
    "env",
    "add",
    name,
    env,
    "--value",
    value,
    "--yes",
  ], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Failed to add ${name} for ${env}`);
}

const prodUrl = process.env.DATABASE_URL;
if (!prodUrl) throw new Error("DATABASE_URL not in .env.production");

const stagingUrl = new URL(prodUrl);
stagingUrl.pathname = "/nhwhq_staging";

add("DATABASE_URL", "production", prodUrl);
add("DATABASE_URL", "preview", stagingUrl.toString());
