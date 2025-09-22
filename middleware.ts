// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ⬇️ n’applique PAS le middleware sur /api/* ni les assets Next
export const config = {
  matcher: ["/((?!api/|_next/|static/|favicon.ico).*)"],
  runtime: "nodejs",
};

const publicPaths = ["/login", "/post-login", "/favicon.ico"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (publicPaths.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // protège uniquement le reste de l'app (pas /api/*)
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}