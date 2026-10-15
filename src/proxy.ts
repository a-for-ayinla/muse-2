import { NextRequest, NextResponse } from "next/server";

/**
 * Optimistic gate (Next.js "proxy" convention): checks the session cookie
 * exists for protected pages and bounces to /login with a `next` return
 * path. Authoritative identity verification always happens server-side in
 * the app layout and every route handler — the cookie value is never
 * trusted on its own.
 */
const PROTECTED = ["/listen", "/create", "/playlists", "/history", "/settings"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!needsAuth) return NextResponse.next();
  const hasCookie = Boolean(req.cookies.get("muse_session")?.value);
  if (hasCookie) return NextResponse.next();
  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/listen/:path*", "/create/:path*", "/playlists/:path*", "/history/:path*", "/settings/:path*"],
};
