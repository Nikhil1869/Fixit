import Dashboard from "@/components/Dashboard";
export default function DashboardEmployee({ user }) {
  return <Dashboard user={user} initialScope="queue" />;
}
