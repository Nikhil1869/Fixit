import "server-only";
import { z } from "zod";
import { chatServices } from "@/lib/chat/knowledge";
import { requireUser } from "@/lib/current-user";
import { GET as getBookings } from "@/app/api/bookings/route";
import { GET as getAvailability } from "@/app/api/availability/route";

const serviceNames = chatServices.map(({ name }) => name);
const service = z.enum(serviceNames);
const tool = (name, description, properties, required) => ({
  type: "function",
  function: {
    name,
    description,
    strict: true,
    parameters: { type: "object", properties, required, additionalProperties: false },
  },
});
const serviceProperty = { type: "string", enum: serviceNames };
export const chatTools = [
  tool("suggest_service", "Attach a verified catalog service link.", { service: serviceProperty }, [
    "service",
  ]),
  tool(
    "lookup_availability",
    "Read live aggregate slots. Requires an exact service and YYYY-MM-DD date; ask if missing.",
    { service: serviceProperty, date: { type: "string" } },
    ["service", "date"],
  ),
  
  tool(
    "my_bookings",
    "Read the signed-in customer's latest 20 bookings, only with explicit sharing permission. Scope must be mine. No user ID argument.",
    {
      scope: {
        type: "string",
        enum: ["mine"],
      },
    },
    ["scope"],
  ),

];

// These handlers reuse the application's authenticated read APIs in-process. No
// HTTP cookies, client-supplied IDs or model-generated query predicates are forwarded.
export async function executeChatTool(name, args, { shareBookings }) {
  if (name === "suggest_service") {
    const parsed = z.object({ service }).strict().parse(args);
    return {
      service: parsed.service,
      href: `/homeservices/service/${encodeURIComponent(parsed.service)}`,
    };
  }
  if (name === "lookup_availability") {
    const parsed = z.object({ service, date: z.iso.date() }).strict().parse(args);
    const response = await getAvailability(
      new Request(`http://internal/api/availability?${new URLSearchParams(parsed)}`),
    );
    if (!response.ok) return { error: "Availability could not be verified. Try the booking page." };
    return {
      ...parsed,
      ...(await response.json()),
      checkedAt: new Date().toISOString(),
      snapshotOnly: true,
    };
  }
  
  if (name === "my_bookings") {
    z.object({
      scope: z.literal("mine"),
    }).strict().parse(args);

    if (!shareBookings)
      return { error: "Booking sharing is off. Enable it explicitly, or view your Dashboard." };
    await requireUser("customer");
    const response = await getBookings(new Request("http://internal/api/bookings?scope=mine"));
    if (!response.ok)
      return { error: "Your booking status could not be verified. Open Dashboard." };
    const data = await response.json();
    return {
      bookings: data.bookings.map(({ service, date, time, status }) => ({
        service,
        date,
        time,
        status,
      })),
      hasMore: Boolean(data.nextCursor),
      order: "latest created, at most 20; not a complete upcoming-bookings search",
      checkedAt: new Date().toISOString(),
    };
  }
  return { error: "This tool is not permitted. Bookings are read-only." };
}
