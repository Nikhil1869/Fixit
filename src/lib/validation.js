import { z } from "zod";
import { getServiceByName, getServicesByCategory } from "@/data/homeservices";

const text = (max) => z.string().trim().min(1).max(max);
export const credentialsSchema = z.object({
  username: text(50).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z
    .string()
    .min(1)
    .max(72)
    .refine((v) => Buffer.byteLength(v, "utf8") <= 72),
});
export const registrationSchema = credentialsSchema
  .extend({
    password: z
      .string()
      .min(12)
      .max(72)
      .refine((v) => Buffer.byteLength(v, "utf8") <= 72),
    email: z
      .email()
      .max(254)
      .transform((v) => v.trim().toLowerCase()),
    phone: text(20).regex(/^\+?[0-9 ()-]{7,20}$/),
    street: text(200).optional(),
    city: text(100).optional(),
    state: text(100).optional(),
    category: text(80).optional(),
    service: text(80).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.service) {
      if (
        !value.category ||
        !getServicesByCategory(value.category).some((s) => s.name === value.service)
      ) {
        context.addIssue({ code: "custom", message: "Select a valid category and service." });
      }
    } else if (value.category || !value.street || !value.city || !value.state) {
      context.addIssue({ code: "custom", message: "Customer address is required." });
    }
  });

export const objectId = z.string().regex(/^[a-f0-9]{24}$/i);
export const bookingActionSchema = z.object({ bookingId: objectId }).strict();
export const bookingSchema = z
  .object({
    service: text(80).refine((value) => Boolean(getServiceByName(value))),
    date: z.iso.date(),
    time: z.string().regex(/^(?:[01]\d|2[0-3]):00$/),
    requestId: z.uuid(),
  })
  .strict()
  .superRefine((value, context) => {
    // The existing India-focused service catalog uses one explicit business zone.
    const timestamp = new Date(`${value.date}T${value.time}:00+05:30`).getTime();
    const now = Date.now();
    if (!Number.isFinite(timestamp) || timestamp <= now || timestamp > now + 180 * 86400000) {
      context.addIssue({
        code: "custom",
        message: "Select a future time within 180 days (Asia/Kolkata).",
      });
    }
  });

export const scheduleSchema = z
  .array(
    z
      .object({
        day: z.number().int().min(0).max(6),
        startHour: z.number().int().min(0).max(23),
        endHour: z.number().int().min(1).max(24),
      })
      .strict()
      .refine((v) => v.endHour > v.startHour),
  )
  .max(7)
  .refine((days) => new Set(days.map((d) => d.day)).size === days.length);
export const profileSchema = z
  .object({
    phone: text(20).regex(/^\+?[0-9 ()-]{7,20}$/),
    street: text(200).optional(),
    city: text(100).optional(),
    state: text(100).optional(),
    schedule: scheduleSchema.optional(),
  })
  .strict();
