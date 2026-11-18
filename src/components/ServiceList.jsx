"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAllServiceCategories, getServicesByCategory } from "@/data/homeservices";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Search } from "lucide-react";
const label = (s) => s.replace(/([a-z])([A-Z])/g, "$1 $2");
const categories = getAllServiceCategories();
export default function ServiceList() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [query, setQuery] = useState("");
  const services = useMemo(
    () =>
      categories
        .flatMap((c) => getServicesByCategory(c).map((s) => ({ ...s, category: c })))
        .filter(
          (s) =>
            (category === "All" || s.category === category) &&
            label(s.name).toLowerCase().includes(query.toLowerCase()),
        ),
    [category, query],
  );
  return (
    <main className="page-container section-space">
      <span className="eyebrow">Find your next helping hand</span>
      <h1 className="page-title">Services for your everyday.</h1>
      <p className="lead">Explore the catalog, then check available times for a one-hour visit.</p>
      <div className="catalog-tools">
        <label className="search-field">
          <Search size={19} />
          <span className="sr-only">Search services</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plumbing, cleaning, wellness…"
          />
        </label>
        <div className="filter-row" aria-label="Service categories">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              className={category === c ? "filter-chip selected" : "filter-chip"}
              onClick={() => setCategory(c)}
            >
              {label(c)}
            </button>
          ))}
        </div>
      </div>
      <p className="subtle mb-5" aria-live="polite">
        {services.length} services
      </p>
      <div className="catalog-grid">
        {services.map((s) => (
          <Link
            key={s.name}
            href={"/homeservices/service/" + encodeURIComponent(s.name)}
            className="service-card"
          >
            <div className="service-image">
              <Image
                src={s.image}
                alt={label(s.name)}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 380px"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <span className="eyebrow text-xs">{label(s.category)}</span>
              <div className="flex items-center justify-between mt-2">
                <h3>{label(s.name)}</h3>
                <ArrowUpRight size={19} />
              </div>
              <p className="subtle mt-2 text-sm">{s.description}</p>
            </div>
          </Link>
        ))}
      </div>
      {!services.length && (
        <div className="empty-state">
          <h2>No matching services</h2>
          <p>Try another search or choose a different category.</p>
          <button
            className="btn-secondary mt-4"
            onClick={() => {
              setQuery("");
              setCategory("All");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </main>
  );
}
