import Settings from "@/components/Settings";
import { requirePageUser } from "@/lib/page-user";
export default async function SettingsPage() {
  const user = await requirePageUser();
  return <Settings user={JSON.parse(JSON.stringify(user))} />;
}
