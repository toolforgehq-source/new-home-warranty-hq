import { Client } from "pg";
import { config } from "dotenv";

config({ path: ".env.production" });

const baseUrl = process.env.POSTGRES_URL_NON_POOLING;
if (!baseUrl) throw new Error("POSTGRES_URL_NON_POOLING not set");

const url = new URL(baseUrl);
const dbName = "nhwhq_staging";

const client = new Client({ connectionString: baseUrl });
await client.connect();

const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
if (exists.rowCount === 0) {
  await client.query(`CREATE DATABASE "${dbName}"`);
  console.log(`Created database ${dbName}`);
} else {
  console.log(`Database ${dbName} already exists`);
}
await client.end();

const stagingUrl = new URL(baseUrl);
stagingUrl.pathname = `/${dbName}`;

const stagingClient = new Client({ connectionString: stagingUrl.toString() });
await stagingClient.connect();

// Check if schema already initialized
const tables = await stagingClient.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1");
if (tables.rowCount === 0) {
  console.log("Staging DB is empty; applying schema...");
  const { execSync } = await import("child_process");
  execSync("npx prisma db push --accept-data-loss --skip-generate", {
    env: { ...process.env, DATABASE_URL: stagingUrl.toString() },
    stdio: "inherit",
  });
} else {
  console.log("Staging DB already has schema");
}
await stagingClient.end();
