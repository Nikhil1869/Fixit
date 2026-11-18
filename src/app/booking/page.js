import Booking from "@/components/Booking";
import { requirePageUser } from "@/lib/page-user";
import { getServiceByName } from "@/data/homeservices";
import { notFound } from "next/navigation";
export default async function BookingPage({ searchParams }) {
  const user = await requirePageUser("customer");
  const params = await searchParams;
  if (!getServiceByName(params.service)) notFound();
  return (
    <Booking service={params.service} address={[user.street, user.city, user.state].join(", ")} />
  );
}
