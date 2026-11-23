# API contract

JSON mutation bodies require application/json and are limited to 16 KiB. Browser
origins must match AUTH_URL. Private routes use the signed Auth.js session ID and
reload the database account; never supply a customer ID, provider ID or role.

Errors use `{ "message": "safe explanation" }`: 400 invalid input, 401 sign-in,
403 role/origin denial, 404 inaccessible resource, 409 duplicate/slot/transition
conflict, 413 oversized body, 415 content type, 429 throttle, 503 service failure.
No raw driver exception, stack trace, credential or password is returned.

| Route                     | Method  | Contract                                                                                  |
| ------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| /api/register             | POST    | username, email, phone, password; customer street/city/state OR provider category/service |
| /api/user, /api/me        | GET     | Own account, password excluded, private/no-store                                          |
| /api/profile              | PATCH   | phone; customer street/city/state; provider schedule array                                |
| /api/availability         | GET     | service and date query; returns slots [{time, providers}], timezone, durationMinutes      |
| /api/booking              | POST    | Customer: service, date YYYY-MM-DD, time HH:00, requestId UUID; returns bookingId         |
| /api/bookings             | GET     | scope=mine or provider-only queue; optional status/cursor; 20 bookings plus nextCursor    |
| /api/accepted-booking     | POST    | Provider: bookingId; transactional acceptance                                             |
| /api/reject-booking       | POST    | Provider: bookingId; decline for this provider only                                       |
| /api/bookings/[id]/status | PATCH   | status: in_progress, completed or cancelled; ownership and transition checks              |
| /api/health               | GET     | 200 {status:ok} after Mongo ping, otherwise 503 unavailable                               |
| /api/auth/[...nextauth]   | Auth.js | Credentials login, sessions, sign-out and CSRF                                            |

Username: 1–50 letters/digits/underscore/dot/hyphen. New password: 12–72 characters
and at most 72 UTF-8 bytes (bcrypt bound). Email max 254; phone max 20; street max
200; city/state max 100. Unknown body properties are rejected. Profile edits cannot
change identity, email, service or role.

Weekly schedule: at most seven distinct {day, startHour, endHour} entries, where
day is 0=Sunday through 6=Saturday, startHour 0–23, endHour 1–24, end > start.
An empty schedule closes all days. Customer accounts cannot set provider schedules.

Booking dates must be future and within 180 days in Asia/Kolkata; starts must be
hour-aligned. Address/contact data come from the authenticated customer. Equivalent
creation retries return 200; first creation returns 201. UUID reuse with other
details returns 409. Future-date validation runs before replay lookup.

Pagination uses descending ObjectId cursors. Each page returns nextCursor or null;
subsequent pages remain scoped to the signed identity. Queue records exclude customer
names, phone, email, street and history. Assignment reveals contact details only to
the parties. There is no public booking-list endpoint.

Acceptance updates the request and reservation atomically. Status transitions and
cancellation cutoffs are documented in DATABASE_DESIGN.md. Provider schedule changes
do not retroactively cancel accepted visits. Confirmation means provider acceptance,
not merely a successful customer request.

Throttles: login 10/account/15 minutes; registration 100 total/hour and 5/email/hour;
creation 30/account/minute. Counters are persistent shared MongoDB windows. The global
registration cap is a conservative demo choice; trusted-ingress per-network limits
would improve fairness for a real public service.

# Generative assistant addition

`GET /api/chat` returns `{ available, mode }` with private/no-store caching.
It validates configuration only; it does not call Groq or verify billing/model access.

`POST /api/chat` accepts:

```json
{
  "messages": [{ "role": "user", "content": "How can I book an AC technician?" }],
  "shareBookings": false
}
```

Only alternating user/assistant roles are accepted, beginning/ending with user.
Messages are untrusted conversation data, never system instructions or identity.
Limits: 9 messages, user text 1,500 characters, each assistant text 4,000, combined
10,000, streamed body 16 KiB. Unknown fields, supplied account IDs and tool roles
are rejected. Authenticated customer summaries require explicit `shareBookings`
and the current server session. Anonymous service help remains available.

Success: `{ mode: "ai", message, evidence }`. Evidence contains only allowlisted
catalog links, aggregate availability snapshots or the current customer's minimal
booking summaries. The model has no mutation capability. Errors: 400 invalid/context
budget, 403 origin, 413 size, 415 media type, 429 application/provider quota with
Retry-After, 502 invalid model response, 503 unavailable configuration/provider/DB,
504 provider timeout. Lookup-specific denial is a safe tool error in the generated
conversation, not authorization to read another account. Responses are no-store.

Full controls and configuration: [chatbot architecture](docs/CHATBOT_ARCHITECTURE.md)
and [setup](docs/CHATBOT_SETUP.md). Live inference remains unverified.
