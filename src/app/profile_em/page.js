import DashboardEmployee from "@/components/DashboardEmployee";
import { requirePageUser } from "@/lib/page-user";
export default async function EmployeePage() {
  const user = await requirePageUser("provider");
  return <DashboardEmployee user={JSON.parse(JSON.stringify(user))} />;
}
