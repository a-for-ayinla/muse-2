import { ZodError } from "zod";

/** Consistent JSON error shape: { ok:false, error:{ code, message, requestId } } */
export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "CATALOG_UNAVAILABLE"
  | "PROVIDER_ERROR"
  | "EMAIL_NOT_CONFIGURED"
  | "DB_ERROR"
  | "INTERNAL";

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

export function requestId(): string {
  return crypto.randomUUID();
}

export function ok<T>(data: T, rid: string, status = 200): Response {
  return Response.json({ ok: true, data, requestId: rid }, { status });
}

export function fail(
  code: ApiErrorCode,
  message: string,
  rid: string,
  status = 500,
): Response {
  const safeStatus =
    status === 500 && code !== "INTERNAL" && code !== "DB_ERROR"
      ? ({
          UNAUTHENTICATED: 401,
          FORBIDDEN: 403,
          NOT_FOUND: 404,
          VALIDATION: 422,
          CONFLICT: 409,
          RATE_LIMITED: 429,
          CATALOG_UNAVAILABLE: 503,
          PROVIDER_ERROR: 502,
          EMAIL_NOT_CONFIGURED: 503,
        } as Record<ApiErrorCode, number>)[code] ?? 500
      : status;
  return Response.json(
    { ok: false, error: { code, message, requestId: rid } },
    { status: safeStatus },
  );
}

/** Wrap a handler with consistent error mapping; request ids on every response. */
export function handler(
  fn: (req: Request, rid: string, ctx?: unknown) => Promise<Response>,
) {
  return async (req: Request, ctx?: unknown): Promise<Response> => {
    const rid = requestId();
    try {
      return await fn(req, rid, ctx);
    } catch (e) {
      if (e instanceof ApiError) {
        return fail(e.code, e.message, rid, e.status);
      }
      if (e instanceof ZodError) {
        const first = e.issues[0];
        return fail(
          "VALIDATION",
          first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input.",
          rid,
          422,
        );
      }
      console.error(`[muse] ${rid} internal error`, e);
      return fail(
        "INTERNAL",
        "Something went wrong on our side. Reference: " + rid,
        rid,
        500,
      );
    }
  };
}

/** Enforce a request body size ceiling (bounded, prompt-injection safe). */
export async function readJson(req: Request, maxBytes = 16_384): Promise<unknown> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw new ApiError("VALIDATION", "Request body too large.", 413);
  const raw = await req.text();
  if (raw.length > maxBytes) throw new ApiError("VALIDATION", "Request body too large.", 413);
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError("VALIDATION", "Body must be valid JSON.", 422);
  }
}

/** Validate a URL is http(s) — used before rendering any external listening link. */
export function isSafeExternalUrl(u: string | null | undefined): u is string {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
