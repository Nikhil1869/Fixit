"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock3 } from "lucide-react";
export default function Booking({ service, address }) {
  const [date, setDate] = useState(""),
    [time, setTime] = useState(""),
    [slots, setSlots] = useState([]),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false),
    [requestId, setRequestId] = useState(() => crypto.randomUUID());
  useEffect(() => {
    if (!date) return;
    const abort = new AbortController();
    setLoading(true);
    setError("");
    setSlots([]);
    setTime("");
    setRequestId(crypto.randomUUID());
    fetch("/api/availability?" + new URLSearchParams({ service, date }), { signal: abort.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message);
        setSlots(d.slots);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [date, service]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, date, time, requestId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return (
    <main className="page-container section-space">
      <Link href={"/homeservices/service/" + service} className="text-link mb-7">
        <ArrowLeft size={17} />
        Service details
      </Link>
      <div className="detail-grid">
        <section>
          <span className="eyebrow">Find a time that fits</span>
          <h1 className="page-title">Book {service.replace(/([a-z])([A-Z])/g, "$1 $2")}.</h1>
          <p className="lead">
            Choose an available one-hour slot. Your request is confirmed when a provider accepts.
          </p>
          <div className="surface">
            {done ? (
              <div>
                <h2>Request received.</h2>
                <p className="feedback success" role="status">
                  Your request is saved. Awaiting provider acceptance.
                </p>
                <p className="subtle">
                  Follow progress and see your provider’s details from your bookings.
                </p>
                <Link className="btn mt-6" href="/profile_cu">
                  View my bookings ↗
                </Link>
              </div>
            ) : (
              <form onSubmit={submit}>
                <label className="field">
                  Select Date (India time)
                  <input
                    type="date"
                    id="date"
                    min={today}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </label>
                {loading ? (
                  <p className="loading-block" role="status">
                    Finding available times…
                  </p>
                ) : date ? (
                  <>
                    <h3 className="mt-6">Available times</h3>
                    <div className="slot-grid">
                      {slots.map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          className="slot"
                          aria-pressed={time === s.time}
                          onClick={() => {
                            setTime(s.time);
                            setRequestId(crypto.randomUUID());
                          }}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                    {!slots.length && !error && (
                      <p className="subtle my-6">
                        No open slots on this day. Please choose another date.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="subtle my-6">Choose a date to see provider availability.</p>
                )}
                {error && (
                  <p className="feedback error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="btn w-full justify-center mt-4"
                  disabled={!time || busy || loading}
                  type="submit"
                >
                  {busy ? "Saving request…" : "Request booking"}
                </button>
              </form>
            )}
          </div>
        </section>
        <aside className="surface">
          <h3>Your visit</h3>
          <div className="feature-list">
            <p className="flex gap-3">
              <MapPin size={20} className="shrink-0" />
              {address}
            </p>
            <p className="flex gap-3">
              <Clock3 size={20} />
              60 minutes · Asia/Kolkata
            </p>
          </div>
          <Link className="text-link" href="/settings">
            Update your address ↗
          </Link>
          <p className="subtle text-sm mt-6">
            Times shown are available now and may change before a provider accepts. No payment is
            collected in this demo.
          </p>
        </aside>
      </div>
    </main>
  );
}
