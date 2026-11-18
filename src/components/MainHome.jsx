import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CalendarDays, CheckCircle2, ShieldCheck } from "lucide-react";

export default function MainHome() {
  return (
    <main>
      <section className="page-container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">A little help. A better day.</span>
          <h1>
            Good service starts
            <br />
            with a simple <span className="accent">plan.</span>
          </h1>
          <p className="lead">
            Find the help you need, choose a time that works, and keep every request in one place.
          </p>
          <div className="button-row">
            <Link className="btn" href="/homeservices">
              Explore services <ArrowUpRight size={18} />
            </Link>
            <Link className="btn-secondary" href="/signupEmployee">
              Become a provider
            </Link>
          </div>
          <p className="subtle mt-6 flex items-center gap-2">
            <ShieldCheck size={17} /> Clear requests. Visible progress. Your own booking history.
          </p>
        </div>
        <div className="hero-art">
          <Image
            src="/homeservicess.jpg"
            alt="Home services"
            fill
            sizes="(max-width: 800px) 100vw, 550px"
            priority
            className="object-cover"
          />
          <div className="hero-caption">
            <span className="icon-badge">
              <CalendarDays size={22} />
            </span>
            <div>
              <strong>Your time, thoughtfully planned</strong>
              <p>One-hour visits · India Standard Time</p>
            </div>
          </div>
        </div>
      </section>
      <section className="page-container section-space">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Help for the everyday</span>
            <h2>What can we help with?</h2>
          </div>
          <Link className="text-link" href="/homeservices">
            View all services <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              name: "Plumber",
              label: "Home repairs",
              image: "/plumber.jpeg",
              text: "Keep the essentials running smoothly.",
            },
            {
              name: "HomeCleaner",
              label: "Home cleaning",
              image: "/homecleaner.jpeg",
              text: "Make room for a fresher start.",
            },
            {
              name: "Beautician",
              label: "Beauty & wellness",
              image: "/beutician.jpeg",
              text: "A little time dedicated to you.",
            },
          ].map((s) => (
            <Link href={"/homeservices/service/" + s.name} key={s.name} className="service-card">
              <div className="service-image">
                <Image
                  src={s.image}
                  alt={s.label}
                  fill
                  sizes="(max-width: 768px) 100vw, 380px"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3>{s.label}</h3>
                  <ArrowUpRight size={20} />
                </div>
                <p className="subtle mt-2">{s.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="soft-section">
        <div className="page-container section-space">
          <span className="eyebrow">From request to done</span>
          <h2>A straightforward way to book.</h2>
          <div className="grid gap-8 md:grid-cols-3 mt-8">
            {[
              ["01", "Find your service", "Browse the catalog and choose the right kind of help."],
              [
                "02",
                "Choose an available time",
                "Request a one-hour visit. A matching provider confirms the booking.",
              ],
              [
                "03",
                "Follow the progress",
                "See acceptance, work in progress, and completion in your dashboard.",
              ],
            ].map(([n, title, copy]) => (
              <div key={n}>
                <span className="step-number">{n}</span>
                <h3 className="mt-4">{title}</h3>
                <p className="subtle mt-2">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="page-container section-space">
        <div className="provider-banner">
          <div>
            <CheckCircle2 className="mb-4" size={28} />
            <h2>
              Bring your skills.
              <br />
              We’ll help organize the work.
            </h2>
            <p className="mt-3">Set your hours, review requests, and manage each visit.</p>
          </div>
          <Link href="/signupEmployee" className="btn-white">
            Create a provider account <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
