import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(error) {
  if (error instanceof HttpError) {
    return Response.json({ message: error.message }, { status: error.status });
  }
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return Response.json(
      { message: "Invalid request. Check the supplied fields." },
      { status: 400 },
    );
  }
  if (error?.code === 11000) {
    return Response.json(
      { message: "This account or booking already exists, or the slot is taken." },
      { status: 409 },
    );
  }
  // Never serialize/log driver errors: they can contain credentials or user data.
  return Response.json(
    { message: "The service is temporarily unavailable. Please try again." },
    { status: 503 },
  );
}

export async function readJson(request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.AUTH_URL || request.url).origin;
  if (origin && origin !== expected) throw new HttpError(403, "Request origin is not allowed.");
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new HttpError(415, "Send an application/json request.");
  }
  // Bound streamed bodies too, rather than trusting Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "A request body is required.");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16_384) {
        await reader.cancel();
        throw new HttpError(413, "Request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
