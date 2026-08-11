import { config } from "dotenv";
import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { randomBytes } from "crypto";

config({ path: ".env.production" });

const token = process.env.VERCEL_TOKEN;
if (!token) throw new Error("VERCEL_TOKEN not set");

const authSecret = readFileSync("/tmp/auth_secret", "utf8").trim();
const cronSecret = randomBytes(32).toString("hex");

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

add("BETTER_AUTH_SECRET", "preview", authSecret);
add("BETTER_AUTH_URL", "preview", "https://new-home-warranty-hq.vercel.app");
add("NEXT_PUBLIC_APP_URL", "preview", "https://new-home-warranty-hq.vercel.app");
add("CRON_SECRET", "preview", cronSecret);
