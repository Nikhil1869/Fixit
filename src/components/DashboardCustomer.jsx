import Dashboard from "@/components/Dashboard";
import { requirePageUser } from "@/lib/page-user";
export default async function DashboardCustomer() {
  const user = await requirePageUser("customer");
  return <Dashboard user={JSON.parse(JSON.stringify(user))} />;
}
