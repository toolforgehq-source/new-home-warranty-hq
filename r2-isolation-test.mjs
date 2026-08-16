import { S3Client, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const ownBucket = process.env.R2_BUCKET_NAME;
const targetBucket = process.env.TARGET_BUCKET;

if (!endpoint || !accessKeyId || !secretAccessKey || !ownBucket || !targetBucket) {
  console.error("Missing R2 env vars: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, TARGET_BUCKET");
  process.exit(1);
}

const client = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } });

async function attempt(name, fn) {
  try {
    const result = await fn();
    console.log(`${name}: OK`);
    return true;
  } catch (err) {
    console.log(`${name}: ${err.name} - ${err.message}`);
    return false;
  }
}

const listBuckets = await attempt("ListBuckets", () => client.send(new ListBucketsCommand({})));
const listOwn = await attempt(`ListObjects in own bucket (${ownBucket})`, () => client.send(new ListObjectsV2Command({ Bucket: ownBucket, MaxKeys: 1 })));
const putOwn = await attempt(`PutObject in own bucket (${ownBucket})`, () => client.send(new PutObjectCommand({ Bucket: ownBucket, Key: `isolation-test-${Date.now()}.txt`, Body: "test" })));
const putTarget = await attempt(`PutObject in target bucket (${targetBucket})`, () => client.send(new PutObjectCommand({ Bucket: targetBucket, Key: `isolation-test-${Date.now()}.txt`, Body: "test" })));

if (!putTarget) {
  console.log("\nISOLATION: PASS — credentials cannot write to target bucket.");
  process.exit(0);
} else {
  console.log("\nISOLATION: FAIL — credentials CAN write to target bucket.");
  process.exit(1);
}
