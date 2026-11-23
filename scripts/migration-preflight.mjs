import mongoose from "mongoose";
import { auditMigration } from "./lib/migration-audit.mjs";

// Require an explicit staging label; URI must arrive through a private env file.
if (!process.env.MONGODB_URI || process.env.MIGRATION_PREFLIGHT_TARGET !== "staging") {
  console.error(
    "Configure MONGODB_URI privately and MIGRATION_PREFLIGHT_TARGET=staging. No connection attempted.",
  );
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 5000,
  });
  const report = await auditMigration(mongoose.connection.db, mongoose.connection.getClient());
  console.log(JSON.stringify(report, null, 2));
  if (!report.readyForReviewedMigration) process.exitCode = 2;
} catch {
  console.error(
    "Preflight unavailable. Verify staging configuration and read permissions privately.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
