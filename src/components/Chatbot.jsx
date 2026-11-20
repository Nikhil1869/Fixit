"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";

const suggestions = [
  "My AC isn't cooling. What can I check safely?",
  "How does a booking become confirmed?",
  "What cleaning services are offered?",
];

function Evidence({ items }) {
  return items?.map(({ type, data }, index) => {
    if (data.error)
      return (
        <p className="chat-evidence" key={index}>
          {data.error}
        </p>
      );
    if (type === "suggest_service")
      return (
        <Link className="chat-evidence" key={index} href={data.href}>
          View {data.service}
        </Link>
      );
    if (type === "lookup_availability")
      return (
        <div className="chat-evidence" key={index}>
          <strong>Verified availability snapshot</strong>
          <p>
            {data.service} · {data.date} · Asia/Kolkata
          </p>
          <p>
            {data.slots.length
              ? data.slots.map((slot) => `${slot.time} (${slot.providers} available)`).join(", ")
              : "No offered slots for this date."}
          </p>
          <small>Not reserved. Recheck in the booking form.</small>
        </div>
      );
    if (type === "my_bookings")
      return (
        <div className="chat-evidence" key={index}>
          <strong>Verified booking snapshot</strong>
          {data.bookings.length ? (
            <ul>
              {data.bookings.map((booking, i) => (
                <li key={i}>
                  {booking.service} · {booking.date.slice(0, 10)} {booking.time} · {booking.status}
                </li>
              ))}
            </ul>
          ) : (
            <p>No bookings returned for your account.</p>
          )}
          <p>
            Latest 20 by creation, Asia/Kolkata. {data.hasMore ? "More records exist. " : ""}
            <Link href="/profile_cu">View Dashboard</Link>
          </p>
        </div>
      );
    return null;
  });
}

export default function Chatbot() {
  const dialog = useRef(null);
  const launcher = useRef(null);
  const input = useRef(null);
  const log = useRef(null);
  const active = useRef(null);
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState("");
  const [failed, setFailed] = useState("");
  const [error, setError] = useState("");
  const [shareBookings, setShareBookings] = useState(false);

  useEffect(() => {
    if (!open) return;
    dialog.current.showModal();
    input.current?.focus();
    const controller = new AbortController();
    fetch("/api/chat", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => setAvailable(data.available))
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });
    return () => controller.abort();
  }, [open]);
  useEffect(() => {
    log.current?.scrollTo(0, log.current.scrollHeight);
  }, [messages, pending, error]);
  useEffect(() => () => active.current?.abort(), []);

  function clear() {
    active.current?.abort();
    active.current = null;
    setMessages([]);
    setPending("");
    setDraft("");
    setFailed("");
    setError("");
  }
  function close() {
    dialog.current.close();
    setOpen(false);
    launcher.current?.focus();
  }
  async function send(text) {
    const content = text.trim();
    if (!content || content.length > 1500 || pending || !available) return;
    const controller = new AbortController();
    active.current = controller;
    const timer = setTimeout(() => controller.abort(), 35000);
    setPending(content);
    setDraft("");
    setFailed("");
    setError("");
    const history = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    while (
      history.length &&
      history.reduce((sum, m) => sum + m.content.length, content.length) > 10000
    )
      history.splice(0, 2);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...history, { role: "user", content }], shareBookings }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "The assistant is unavailable. Please retry.");
      if (active.current !== controller) return;
      setMessages((previous) =>
        [
          ...previous,
          { role: "user", content },
          { role: "assistant", content: data.message, evidence: data.evidence },
        ].slice(-8),
      );
    } catch (failure) {
      if (active.current !== controller) return;
      setError(
        failure.name === "AbortError" ? "The request timed out. Please retry." : failure.message,
      );
      setFailed(content);
    } finally {
      clearTimeout(timer);
      if (active.current === controller) {
        active.current = null;
        setPending("");
        input.current?.focus();
      }
    }
  }

  return (
    <>
      <button
        ref={launcher}
        type="button"
        className="chat-launcher"
        aria-label="Open Fixit assistant"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setAvailable(null);
          setOpen(true);
        }}
      >
        <MessageCircle aria-hidden="true" size={23} />
      </button>
      <dialog
        ref={dialog}
        className="chat-window"
        aria-labelledby="chat-title"
        aria-describedby="chat-privacy"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <header className="chat-header">
          <div>
            <h2 id="chat-title">Fixit assistant</h2>
            <span>
              {available === null
                ? "Checking AI configuration…"
                : available
                  ? "Generative AI · read-only"
                  : "Generative AI unavailable"}
            </span>
          </div>
          <button type="button" aria-label="Close assistant" onClick={close}>
            <X aria-hidden="true" />
          </button>
        </header>
        <p className="chat-privacy" id="chat-privacy">
          Messages go to Groq. Don’t share secrets or contact details. Memory lasts only in this
          open app session; AI can make mistakes.
        </p>
        <div
          className="chat-log"
          ref={log}
          role="log"
          aria-label="Conversation"
          aria-live="polite"
          aria-relevant="additions"
          tabIndex={0}
        >
          <p className="chat-bubble">
            Hello! Ask about Fixit services, booking steps, or a home-maintenance concern. I can
            explain and look up information, but cannot change bookings.
          </p>
          {messages.map((message, i) => (
            <div key={i} className={`chat-bubble chat-${message.role}`}>
              <span className="sr-only">{message.role === "user" ? "You" : "Assistant"}: </span>
              <p>{message.content}</p>
              {message.role === "assistant" && <Evidence items={message.evidence} />}
            </div>
          ))}
          {pending && (
            <>
              <p className="chat-bubble chat-user">{pending}</p>
              <p role="status">The assistant is thinking…</p>
            </>
          )}
        </div>
        <div className="chat-controls">
          {available === false && (
            <p role="status">
              Generative AI is unavailable. Browse <Link href="/homeservices">services</Link> or{" "}
              <Link href="/profile_cu">your Dashboard</Link> while AI is unavailable.
            </p>
          )}
          {messages.length === 0 && (
            <div className="chat-suggestions">
              {suggestions.map((text) => (
                <button
                  key={text}
                  type="button"
                  disabled={!available || Boolean(pending)}
                  onClick={() => send(text)}
                >
                  {text}
                </button>
              ))}
            </div>
          )}
          {error && (
            <div role="alert">
              <p>{error}</p>
              <button type="button" disabled={Boolean(pending)} onClick={() => send(failed)}>
                Retry message
              </button>
            </div>
          )}
          <label className="chat-sharing">
            <input
              type="checkbox"
              checked={shareBookings}
              onChange={(event) => {
                clear();
                setShareBookings(event.target.checked);
              }}
            />{" "}
            Allow my booking summaries to be sent to AI when requested (requires customer sign-in).
            Changing this clears chat.
          </label>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
          >
            <label htmlFor="chat-message" className="sr-only">
              Message to Fixit assistant
            </label>
            <textarea
              ref={input}
              id="chat-message"
              value={draft}
              maxLength={1500}
              rows={2}
              placeholder="Ask a question…"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send(draft);
                }
              }}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!available || Boolean(pending) || !draft.trim()}
            >
              <Send size={20} aria-hidden="true" />
            </button>
          </form>
          <div className="chat-bottom">
            <small>{draft.length}/1500 · Enter to send</small>
            <button type="button" onClick={clear}>
              Clear conversation
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
