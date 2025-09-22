// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export const config = {
  // exclut tout /api/*, et les assets
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

const publicPaths = ["/login", "/post-login", "/favicon.ico"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (publicPaths.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}