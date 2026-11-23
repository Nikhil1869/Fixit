"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export default function Settings({ user }) {
  const [days, setDays] = useState(user.schedule || []),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const router = useRouter();
  function update(day, values) {
    setDays((old) => old.map((d) => (d.day === day ? { ...d, ...values } : d)));
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (user.service)
      data.schedule = days.map(({ day, startHour, endHour }) => ({ day, startHour, endHour }));
    try {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setMessage(d.message);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="page-container section-space">
      <div className="max-w-3xl mx-auto">
        <span className="eyebrow">Keep the details up to date</span>
        <h1 className="page-title">Profile & settings.</h1>
        <p className="lead">
          {user.username} · {user.email}
        </p>
        <form className="surface space-y-6" onSubmit={submit}>
          <h2>Contact details</h2>
          <label className="field">
            Phone Number
            <input name="phone" type="tel" defaultValue={user.phone} maxLength={20} required />
          </label>
          {!user.service && (
            <>
              <label className="field">
                Street Address
                <input name="street" defaultValue={user.street} maxLength={200} required />
              </label>
              <div className="form-grid">
                <label className="field">
                  City
                  <input name="city" defaultValue={user.city} maxLength={100} required />
                </label>
                <label className="field">
                  State
                  <input name="state" defaultValue={user.state} maxLength={100} required />
                </label>
              </div>
            </>
          )}
          {user.service && (
            <section>
              <h2 className="mb-3">Weekly availability</h2>
              <p className="subtle text-sm mb-4">
                One-hour visits, in India Standard Time. Uncheck a day to close it. Existing
                accepted bookings remain scheduled when you change these hours.
              </p>
              {weekdays.map((name, day) => {
                const entry = days.find((d) => d.day === day);
                return (
                  <div className="schedule-row" key={day}>
                    <label className="text-sm flex gap-2 items-center">
                      <input
                        type="checkbox"
                        checked={!!entry}
                        onChange={(e) =>
                          setDays((old) =>
                            e.target.checked
                              ? [...old, { day, startHour: 9, endHour: 17 }]
                              : old.filter((d) => d.day !== day),
                          )
                        }
                      />
                      {name}
                    </label>
                    {entry ? (
                      <>
                        <label className="field">
                          <span className="sr-only">{name} opening hour</span>
                          <select
                            value={entry.startHour}
                            onChange={(e) => update(day, { startHour: Number(e.target.value) })}
                          >
                            {Array.from({ length: 24 }, (_, h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, "0")}:00
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span className="sr-only">{name} closing hour</span>
                          <select
                            value={entry.endHour}
                            onChange={(e) => update(day, { endHour: Number(e.target.value) })}
                          >
                            {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, "0")}:00
                              </option>
                            ))}
                          </select>
                        </label>
                      </>
                    ) : (
                      <span className="subtle text-sm col-span-2">Closed</span>
                    )}
                  </div>
                );
              })}
            </section>
          )}
          {error && (
            <p className="feedback error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="feedback success" role="status">
              {message}
            </p>
          )}
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </button>
          <p className="subtle text-sm">
            Username, email, and account type cannot be changed here. Booking records retain their
            original contact details.
          </p>
        </form>
      </div>
    </main>
  );
}
