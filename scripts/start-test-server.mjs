import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";

// Dedicated ephemeral replica set, never a production URI or user .env database.
const replica = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: "wiredTiger" },
  binary: { version: "7.0.24" },
});
const serverMode = process.argv.includes("--dev") ? "dev" : "start";
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", serverMode, "-H", "127.0.0.1", "-p", "3100"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      MONGODB_URI: replica.getUri("fixit_browser_test"),
      AUTH_SECRET: randomBytes(48).toString("base64"),
      AUTH_URL: "http://127.0.0.1:3100",
      AUTH_TRUST_HOST: "true",
      // Browser tests intercept chat requests; never inherit a paid provider key.
      GROQ_API_KEY: "",
      AI_FREE_PLAN_CONFIRMED: "false",
      AI_MODEL: "",
    },
  },
);
let closing = false;
async function close(code = 0) {
  if (closing) return;
  closing = true;
  child.kill();
  await replica.stop();
  process.exit(code);
}
process.on("SIGINT", () => close());
process.on("SIGTERM", () => close());
child.on("exit", (code) => close(code || 0));
