import { Suspense } from "react";
import ServiceList from "@/components/ServiceList";
export default function CategoryServicesPage() {
  return (
    <Suspense fallback={<p className="page-container section-space">Loading services…</p>}>
      <ServiceList />
    </Suspense>
  );
}
