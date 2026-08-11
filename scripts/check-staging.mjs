import { config } from "dotenv";
import { Client } from "pg";
import { spawnSync } from "child_process";
import { unlinkSync } from "fs";

spawnSync("npx", [
  "vercel", "--token", process.env.VERCEL_TOKEN, "--non-interactive",
  "env", "pull", "--environment=preview", "--yes", ".env.preview.seed",
], { stdio: "inherit" });

config({ path: ".env.preview.seed" });

const base = process.env.POSTGRES_URL;
if (!base) throw new Error("POSTGRES_URL not set");
const url = new URL(base);
url.pathname = "/nhwhq_staging";

console.log("Connecting to", url.host, url.pathname);
const client = new Client({ connectionString: url.toString() });
await client.connect();
const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
console.log("Tables:", res.rows.map(r => r.table_name).join(", "));
await client.end();
unlinkSync(".env.preview.seed");
