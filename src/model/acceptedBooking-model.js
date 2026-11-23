import mongoose, { Schema } from "mongoose";

const AcceptedBookingSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
  customerId: { type: Schema.Types.ObjectId, ref: "User" },
  employeeId: { type: Schema.Types.ObjectId, ref: "User" },
  active: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ["accepted", "in_progress", "completed", "cancelled"],
    default: "accepted",
  },
  employeeUsername: { type: String, required: true },
  employeeEmail: { type: String, required: true },
  employeePhone: { type: String, required: true },
  customerUsername: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  street: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  service: { type: String, required: false },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // ✅ Ensure time is required
});

AcceptedBookingSchema.index(
  { bookingId: 1 },
  { unique: true, partialFilterExpression: { bookingId: { $type: "objectId" } } },
);
AcceptedBookingSchema.index({ service: 1, date: 1, active: 1 });
AcceptedBookingSchema.index(
  { employeeId: 1, date: 1, time: 1 },
  {
    name: "unique_active_provider_slot_v2",
    unique: true,
    partialFilterExpression: { employeeId: { $type: "objectId" }, active: true },
  },
);

// Ensure consistent model name
export const AcceptedBooking =
  mongoose.models.AcceptedBooking || mongoose.model("AcceptedBooking", AcceptedBookingSchema);
