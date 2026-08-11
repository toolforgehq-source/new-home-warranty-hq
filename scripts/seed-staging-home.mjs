import { config } from "dotenv";
import { Client } from "pg";
import { spawnSync } from "child_process";
import { unlinkSync } from "fs";

// Pull preview env to a temp file
const result = spawnSync("npx", [
  "vercel",
  "--token",
  process.env.VERCEL_TOKEN,
  "--non-interactive",
  "env",
  "pull",
  "--environment=preview",
  "--yes",
  ".env.preview.seed",
], { stdio: "inherit" });
if (result.status !== 0) throw new Error("Failed to pull preview env");

config({ path: ".env.preview.seed" });

const userId = process.argv[2];
if (!userId) {
  console.error("Usage: node scripts/seed-staging-home.mjs <userId>");
  process.exit(1);
}

const baseConnectionString = process.env.POSTGRES_URL;
if (!baseConnectionString) throw new Error("POSTGRES_URL not set");

const url = new URL(baseConnectionString);
url.pathname = "/nhwhq_staging";

const client = new Client({ connectionString: url.toString() });
await client.connect();

const purchaseRes = await client.query(
  `INSERT INTO "purchase" (id, "userId", "productType", amount, currency, status, "createdAt", "updatedAt")
   VALUES (gen_random_uuid(), $1, 'HOMEOWNER', 18900, 'usd', 'SUCCEEDED', NOW(), NOW())
   RETURNING id`,
  [userId]
);
const purchaseId = purchaseRes.rows[0].id;

const homeRes = await client.query(
  `INSERT INTO "home" (id, address, "primaryOwnerId", "closingDate", "builderName", "createdAt", "updatedAt")
   VALUES (gen_random_uuid(), '123 QA Test Lane', $1, NOW() - INTERVAL '45 days', 'QA Builder', NOW(), NOW())
   RETURNING id`,
  [userId]
);
const homeId = homeRes.rows[0].id;

await client.query(
  `INSERT INTO "home_entitlement" (id, "homeId", "userId", "purchaseId", status, "createdAt", "updatedAt")
   VALUES (gen_random_uuid(), $1, $2, $3, 'ACTIVE', NOW(), NOW())`,
  [homeId, userId, purchaseId]
);

console.log("Created home", homeId, "purchase", purchaseId, "for user", userId);
await client.end();

unlinkSync(".env.preview.seed");
