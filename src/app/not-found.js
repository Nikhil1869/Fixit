import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page-container section-space">
      <div className="empty-state">
        <span className="eyebrow">404 · A small detour</span>
        <h1 className="page-title">This page is not here.</h1>
        <p>Let’s get you back to finding the right help.</p>
        <Link className="btn mt-6" href="/homeservices">
          Browse services ↗
        </Link>
      </div>
    </main>
  );
}
