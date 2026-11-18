import { z } from "zod";
import { getServiceByName } from "@/data/homeservices";
import { availableSlots } from "@/lib/availability";
import { errorResponse } from "@/lib/http";
const schema = z.object({
  service: z.string().refine((s) => Boolean(getServiceByName(s))),
  date: z.iso.date(),
});
export async function GET(request) {
  try {
    const query = schema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return Response.json(
      {
        slots: await availableSlots(query.service, query.date),
        timezone: "Asia/Kolkata",
        durationMinutes: 60,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
