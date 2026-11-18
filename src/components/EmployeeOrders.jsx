import Dashboard from "@/components/Dashboard";
import { requirePageUser } from "@/lib/page-user";
export default async function EmployeeOrders() {
  const user = await requirePageUser("provider");
  return <Dashboard user={JSON.parse(JSON.stringify(user))} />;
}
