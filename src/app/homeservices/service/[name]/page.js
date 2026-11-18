import { getServiceByName } from "@/data/homeservices";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock3, CalendarDays, ShieldCheck } from "lucide-react";
export default async function ServiceDetails({ params }) {
  const { name } = await params;
  const service = getServiceByName(name);
  if (!service) notFound();
  const label = service.name.replace(/([a-z])([A-Z])/g, "$1 $2");
  return (
    <main className="page-container section-space">
      <Link href="/homeservices" className="text-link mb-8">
        <ArrowLeft size={17} />
        All services
      </Link>
      <div className="detail-grid">
        <div>
          <span className="eyebrow">A little help goes a long way</span>
          <h1 className="page-title">{label}</h1>
          <p className="lead">{service.description}</p>
          <div className="detail-image">
            <Image
              src={service.image}
              alt={label}
              fill
              priority
              sizes="(max-width: 800px) 100vw, 700px"
              className="object-cover"
            />
          </div>
          <h2 className="mt-8">About the service</h2>
          <p className="subtle mt-4">
            Describe the work and agree scope, equipment, and pricing with your provider after
            acceptance. This demo schedules a one-hour visit; larger jobs may need a separate
            arrangement.
          </p>
        </div>
        <aside className="surface booking-summary">
          <span className="eyebrow">Plan your visit</span>
          <h2>Make time for what matters.</h2>
          <ul className="feature-list">
            <li>
              <Clock3 /> One-hour service slot
            </li>
            <li>
              <CalendarDays /> Available times in India Standard Time
            </li>
            <li>
              <ShieldCheck /> Provider confirmation before your visit
            </li>
          </ul>
          <Link
            className="btn w-full justify-center"
            href={"/booking?service=" + encodeURIComponent(service.name)}
          >
            Schedule Now ↗
          </Link>
          <p className="subtle text-sm mt-4">
            This portfolio demo does not process payments. Agree the scope and price directly with
            your assigned provider.
          </p>
          <details className="mt-6">
            <summary>Can I cancel?</summary>
            <p className="subtle mt-2 text-sm">
              Cancel a pending request before its start, or an accepted visit at least two hours
              before the scheduled time.
            </p>
          </details>
        </aside>
      </div>
    </main>
  );
}
