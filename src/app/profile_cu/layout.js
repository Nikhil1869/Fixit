import { requirePageUser } from "@/lib/page-user";
export default async function CustomerLayout({ children }) {
  await requirePageUser("customer");
  return children;
}
