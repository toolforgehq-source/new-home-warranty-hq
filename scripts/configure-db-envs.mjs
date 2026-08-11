import { config } from "dotenv";
import { spawnSync } from "child_process";

config({ path: ".env.production" });

const token = process.env.VERCEL_TOKEN;
if (!token) throw new Error("VERCEL_TOKEN not set");

const pooledBase = process.env.POSTGRES_PRISMA_URL;
const directBase = process.env.POSTGRES_URL_NON_POOLING;
if (!pooledBase || !directBase) throw new Error("Missing Neon URLs in .env.production");

function urlFor(base, dbName) {
  const url = new URL(base);
  url.pathname = `/${dbName}`;
  return url.toString();
}

function add(name, env, value) {
  const result = spawnSync(
    "npx",
    [
      "vercel",
      "env",
      "add",
      name,
      env,
      "--value",
      value,
      "--sensitive",
      "--force",
      "--yes",
      "--token",
      token,
      "--scope",
      "toolforgehqs-projects",
      "--project",
      "new-home-warranty-hq",
    ],
    { stdio: "inherit" }
  );
  if (result.status !== 0) throw new Error(`Failed to add ${name} for ${env}`);
}

add("DATABASE_URL", "production", urlFor(pooledBase, "neondb"));
add("DIRECT_DATABASE_URL", "production", urlFor(directBase, "neondb"));
add("DATABASE_URL", "preview", urlFor(pooledBase, "nhwhq_staging"));
add("DIRECT_DATABASE_URL", "preview", urlFor(directBase, "nhwhq_staging"));
