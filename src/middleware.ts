import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/token";

/**
 * UX-only gate for /admin pages: redirects visitors without a validly-signed session cookie to
 * the login page. This is NOT the security boundary — every admin page and API re-checks the
 * session (including session version) on the server.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";
  const claims = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value).catch(() => null);

  // Never redirect away from /admin/login here: a signed-but-revoked token would loop.
  // The login page itself checks the full session server-side and redirects if still valid.
  let res: NextResponse;
  if (!claims && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    res = NextResponse.redirect(url);
  } else {
    res = NextResponse.next();
  }
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
