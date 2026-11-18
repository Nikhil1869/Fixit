import { requirePageUser } from "@/lib/page-user";
export default async function ProviderLayout({ children }) {
  await requirePageUser("provider");
  return children;
}
