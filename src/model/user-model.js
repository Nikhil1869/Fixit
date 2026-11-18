import mongoose, { Schema } from "mongoose";
import { DEFAULT_SCHEDULE } from "@/lib/booking-policy";
// import dbConnect from "@/lib/mongo";

// await dbConnect();

const userSchema = new Schema({
  username: { required: true, type: String, unique: true, maxlength: 50 },
  password: { required: true, type: String, select: false },
  email: {
    required: true,
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
  },
  phone: { required: true, type: String },
  street: { type: String },
  city: { type: String },
  state: { type: String },
  category: { type: String },
  service: { type: String },
  schedule: {
    type: [{ day: Number, startHour: Number, endHour: Number }],
    default: () => DEFAULT_SCHEDULE,
  },
  scheduleVersion: { type: Number, default: 0 },
});

userSchema.index({ service: 1 });
export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
