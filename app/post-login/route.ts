import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/get-session";

export const dynamic = "force-dynamic"; // no cache
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);

  // 1) Session Better Auth
  const session = await getServerSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login?error=unauth", req.url));
  }

  // 2) AppUser (link par email si pas encore relié)
  let appUser = await prisma.appUser.findUnique({
    where: { email: session.user.email },
    include: { memberships: { include: { company: { include: { license: true } } } } },
  });

  if (!appUser) {
    appUser = await prisma.appUser.create({
      data: { email: session.user.email, authUserId: session.user.id },
      include: { memberships: { include: { company: { include: { license: true } } } } },
    });
  } else if (!appUser.authUserId) {
    appUser = await prisma.appUser.update({
      where: { id: appUser.id },
      data: { authUserId: session.user.id },
      include: { memberships: { include: { company: { include: { license: true } } } } },
    });
  }

  // 3) Super Admin
  if (appUser.platformRole === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // 4) Choisir la “meilleure” entreprise (owner > admin > member)
  const memberships = appUser.memberships ?? [];
  const pick = (role: "OWNER" | "ADMIN" | "MEMBER") =>
    memberships.find((m) => m.role === role);
  const best =
    pick("OWNER") ?? pick("ADMIN") ?? pick("MEMBER") ?? null;

  if (!best) {
    return NextResponse.redirect(new URL("/login?error=no-company", req.url));
  }

  // 5) (Optionnel) Bloquer si licence expirée/suspendue
  const lic = best.company.license;
  if (lic && (lic.status === "SUSPENDED" || lic.status === "EXPIRED" || lic.expiresAt < new Date())) {
    return NextResponse.redirect(new URL("/login?error=license", req.url));
  }

  // 6) Support d’un retour “returnTo” (ex: /acme/settings)
  const returnTo = url.searchParams.get("returnTo");
  const dest = returnTo?.startsWith(`/${best.company.slug}/`)
    ? returnTo
    : `/${best.company.slug}/dashboard`;

  return NextResponse.redirect(new URL(dest, req.url));
}