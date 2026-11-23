import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { HttpError } from "@/lib/http";

const schema = new mongoose.Schema({
  _id: String,
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, index: { expires: 0 } },
});
const RateLimit = mongoose.models.RateLimit || mongoose.model("RateLimit", schema);

// MongoDB-backed fixed windows work across instances; TTL is cleanup, not enforcement.
// A global registration cap bounds abuse without trusting spoofable forwarding headers.
export async function rateLimit(key, limit, windowMs, cost = 1) {
  if (!Number.isSafeInteger(cost) || cost < 1) throw new Error("Invalid rate-limit cost");
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const id = createHash("sha256").update(`${key}:${bucket}`).digest("hex");
  const update = {
    $inc: { count: cost },
    $setOnInsert: { expiresAt: new Date((bucket + 1) * windowMs) },
  };
  let counter;
  try {
    counter = await RateLimit.findOneAndUpdate({ _id: id }, update, { upsert: true, new: true });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    counter = await RateLimit.findOneAndUpdate(
      { _id: id },
      { $inc: { count: cost } },
      { new: true },
    );
  }
  if (!counter || counter.count > limit)
    throw new HttpError(429, "Too many attempts. Please try later.");
}
