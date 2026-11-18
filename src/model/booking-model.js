import mongoose, { Schema } from "mongoose";

const bookingSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "User" },
  requestId: { type: String },
  status: {
    type: String,
    enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
    default: "pending",
  },
  providerId: { type: Schema.Types.ObjectId, ref: "User" },
  history: [
    {
      status: String,
      at: { type: Date, default: Date.now },
      actorId: { type: Schema.Types.ObjectId, ref: "User" },
    },
  ],
  declinedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  username: { required: true, type: String },
  email: { required: true, type: String },
  phone: { required: true, type: String },
  street: { type: String },
  city: { type: String },
  state: { type: String },
  service: { type: String },
  date: { type: Date, required: true }, // Ensure date is required
  time: { type: String, required: true }, // New field for time
});

bookingSchema.index(
  { customerId: 1, requestId: 1 },
  {
    unique: true,
    partialFilterExpression: { customerId: { $type: "objectId" }, requestId: { $type: "string" } },
  },
);
bookingSchema.index({ service: 1, status: 1, date: 1 });
bookingSchema.index({ customerId: 1, date: -1 });
bookingSchema.index({ customerId: 1, _id: -1 });
bookingSchema.index({ service: 1, status: 1, _id: -1 });
bookingSchema.index({ providerId: 1, _id: -1 });

export const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
