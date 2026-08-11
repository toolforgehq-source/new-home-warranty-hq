import { config } from "dotenv";
import { spawnSync } from "child_process";

config({ path: ".env.production" });

const baseDirect = process.env.POSTGRES_URL_NON_POOLING;
if (!baseDirect) throw new Error("POSTGRES_URL_NON_POOLING not found in .env.production");

function directUrl(dbName) {
  const url = new URL(baseDirect);
  url.pathname = `/${dbName}`;
  return url.toString();
}

function resolve(databaseUrl, label) {
  console.log(`Baseline ${label}...`);
  const result = spawnSync(
    "npx",
    ["prisma", "migrate", "resolve", "--applied", "20260811183510_init"],
    {
      env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_DATABASE_URL: databaseUrl },
      stdio: "inherit",
    }
  );
  if (result.status !== 0) throw new Error(`Failed to baseline ${label}`);
}

resolve(directUrl("neondb"), "production");
resolve(directUrl("nhwhq_staging"), "staging");
