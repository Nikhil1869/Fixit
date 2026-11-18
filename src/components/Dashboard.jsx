"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, MapPin, ArrowRight, Settings2 } from "lucide-react";
export default function Dashboard({ user, initialScope = "mine" }) {
  const provider = Boolean(user.service),
    [scope, setScope] = useState(initialScope),
    [status, setStatus] = useState(""),
    [bookings, setBookings] = useState([]),
    [cursor, setCursor] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useCallback(
    async (next = null, signal) => {
      setLoading(true);
      setError("");
      try {
        const q = new URLSearchParams({ scope });
        if (status && scope === "mine") q.set("status", status);
        if (next) q.set("cursor", next);
        const r = await fetch("/api/bookings?" + q, { signal });
        const data = await r.json();
        if (!r.ok) throw new Error(data.message);
        setBookings((old) => (next ? [...old, ...data.bookings] : data.bookings));
        setCursor(data.nextCursor);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [scope, status],
  );
  useEffect(() => {
    const abort = new AbortController();
    load(null, abort.signal);
    return () => abort.abort();
  }, [load]);
  async function act(id, action) {
    if (
      action === "cancelled" &&
      !window.confirm("Cancel this booking? Its slot will be released.")
    )
      return;
    setBusy(id);
    setError("");
    setNotice("");
    try {
      const statusAction = ["cancelled", "in_progress", "completed"].includes(action);
      const r = await fetch(
        statusAction
          ? "/api/bookings/" + id + "/status"
          : action === "accept"
            ? "/api/accepted-booking"
            : "/api/reject-booking",
        {
          method: statusAction ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(statusAction ? { status: action } : { bookingId: id }),
        },
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setNotice(d.message);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <main className="page-container section-space">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">
            {provider ? "Your work, organized" : "Your services, in one place"}
          </span>
          <h1 className="page-title">Hello, {user.username}.</h1>
          <p className="subtle">
            {provider
              ? user.service.replace(/([a-z])([A-Z])/g, "$1 $2") +
                " provider · manage your requests and visits"
              : "Plan a visit and follow every step from request to completion."}
          </p>
        </div>
        <div className="button-row">
          <Link className="btn-secondary" href="/settings">
            <Settings2 size={17} />
            Settings
          </Link>
          {!provider && (
            <Link className="btn" href="/homeservices">
              Book a service <ArrowRight size={17} />
            </Link>
          )}
        </div>
      </div>
      {provider && (
        <div
          className="tabs"
          role="tablist"
          aria-label="Bookings"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const next =
              event.key === "Home"
                ? "queue"
                : event.key === "End"
                  ? "mine"
                  : scope === "queue"
                    ? "mine"
                    : "queue";
            setScope(next);
            document.getElementById("bookings-tab-" + next)?.focus();
          }}
        >
          <button
            id="bookings-tab-queue"
            role="tab"
            aria-controls="bookings-panel"
            tabIndex={scope === "queue" ? 0 : -1}
            aria-selected={scope === "queue"}
            onClick={() => setScope("queue")}
          >
            Available requests
          </button>
          <button
            id="bookings-tab-mine"
            role="tab"
            aria-controls="bookings-panel"
            tabIndex={scope === "mine" ? 0 : -1}
            aria-selected={scope === "mine"}
            onClick={() => setScope("mine")}
          >
            My orders
          </button>
        </div>
      )}
      <section
        id="bookings-panel"
        role={provider ? "tabpanel" : undefined}
        aria-labelledby={provider ? "bookings-tab-" + scope : undefined}
        tabIndex={provider ? 0 : undefined}
        aria-busy={loading}
      >
        <div className="section-heading">
          <h2>
            {scope === "queue" ? "Available requests" : provider ? "My orders" : "My bookings"}
          </h2>
          {scope === "mine" && (
            <label className="field">
              <span className="sr-only">Filter booking status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                {["pending", "accepted", "in_progress", "completed", "cancelled"].map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {notice && (
          <p className="feedback success" role="status">
            {notice}
          </p>
        )}
        {error && (
          <div className="feedback error" role="alert">
            {error}{" "}
            <button className="underline ml-2" onClick={() => load()}>
              Try again
            </button>
          </div>
        )}
        {!bookings.length && loading ? (
          <p className="loading-block" role="status">
            Loading bookings…
          </p>
        ) : !bookings.length && !error ? (
          <div className="empty-state">
            <CalendarDays className="mx-auto accent mb-4" size={32} />
            <h3>
              {scope === "queue" ? "No matching requests right now" : "No bookings to show yet"}
            </h3>
            <p>
              {scope === "queue"
                ? "New requests for your service will appear here. Check your hours in Settings."
                : "Your visits will appear here. Try another status filter or book a service."}
            </p>
            {!provider && (
              <Link className="btn-secondary mt-5" href="/homeservices">
                Browse services
              </Link>
            )}
          </div>
        ) : null}
        {bookings.map((b) => (
          <article className="booking-row" key={b._id}>
            <div className="booking-row-header">
              <h3>{b.service.replace(/([a-z])([A-Z])/g, "$1 $2")}</h3>
              <span className={"status " + b.status}>{b.status.replace("_", " ")}</span>
            </div>
            <div className="booking-meta">
              <span>
                <CalendarDays size={16} />
                {new Date(b.date).toLocaleDateString("en-IN", {
                  timeZone: "UTC",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span>
                <Clock3 size={16} />
                {b.time} IST · 1 hour
              </span>
              {b.city && (
                <span>
                  <MapPin size={16} />
                  {b.city}
                </span>
              )}
            </div>
            {scope === "queue" ? (
              <p className="subtle text-sm mb-4">
                Customer contact details are shared after you accept.
              </p>
            ) : (
              <div className="booking-contact">
                {provider ? (
                  <>
                    <strong>{b.username}</strong>
                    <p className="subtle">
                      {b.phone} · {b.email}
                    </p>
                    <p className="subtle">
                      {b.street}, {b.city}, {b.state}
                    </p>
                  </>
                ) : b.providerId ? (
                  <>
                    <strong>
                      Provider: <span>{b.providerId.username}</span>
                    </strong>
                    <p className="subtle">
                      {b.providerId.phone} · {b.providerId.email}
                    </p>
                  </>
                ) : (
                  <p className="subtle">Waiting for a provider to accept this request.</p>
                )}
              </div>
            )}
            <div className="button-row mt-5">
              {scope === "queue" ? (
                <>
                  <button
                    disabled={!!busy}
                    className="btn btn-small"
                    onClick={() => act(b._id, "accept")}
                  >
                    Accept
                  </button>
                  <button
                    disabled={!!busy}
                    className="btn-secondary btn-small"
                    onClick={() => act(b._id, "decline")}
                  >
                    Decline
                  </button>
                </>
              ) : (
                <>
                  {provider && b.status === "accepted" && (
                    <button
                      disabled={!!busy}
                      className="btn btn-small"
                      onClick={() => act(b._id, "in_progress")}
                    >
                      Start service
                    </button>
                  )}
                  {provider && b.status === "in_progress" && (
                    <button
                      disabled={!!busy}
                      className="btn btn-small"
                      onClick={() => act(b._id, "completed")}
                    >
                      Mark completed
                    </button>
                  )}
                  {((!provider && ["pending", "accepted"].includes(b.status)) ||
                    (provider && b.status === "accepted")) && (
                    <button
                      disabled={!!busy}
                      className="btn-secondary btn-small"
                      onClick={() => act(b._id, "cancelled")}
                    >
                      Cancel booking
                    </button>
                  )}
                </>
              )}
            </div>
            {scope !== "queue" && b.history?.length > 0 && (
              <details className="mt-5 text-sm">
                <summary className="text-link cursor-pointer">Status history</summary>
                <ol className="subtle mt-3 space-y-2">
                  {b.history.map((h, i) => (
                    <li key={i}>
                      {h.status.replace("_", " ")} ·{" "}
                      {new Date(h.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </article>
        ))}
        {cursor && (
          <button className="btn-secondary" disabled={loading} onClick={() => load(cursor)}>
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </section>
    </main>
  );
}
