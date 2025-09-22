// app/[slug]/dashboard/page.tsx
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // adapte le chemin si besoin
import { getServerSession } from "@/lib/get-session";

export const dynamic = "force-dynamic"; // pas de cache pour un dashboard privé
export const revalidate = 0;

export default async function CompanyDashboard({ params }: { params: { slug: string } }) {
  // 1) Session Better Auth (pas de await sur headers())
  const session = await getServerSession();
  if (!session) redirect("/login"); // ou notFound();

  // 2) Récupérer l'AppUser par authUserId, fallback par email si pas encore lié
  let appUser =
    (await prisma.appUser.findFirst({
      where: { authUserId: session.user.id },
      include: { memberships: { include: { company: true } } },
    })) ??
    (await prisma.appUser.findUnique({
      where: { email: session.user.email },
      include: { memberships: { include: { company: true } } },
    }));

  // Si aucun AppUser, on peut en créer un « à la volée »
  if (!appUser) {
    appUser = await prisma.appUser.create({
      data: { email: session.user.email, authUserId: session.user.id },
      include: { memberships: { include: { company: true } } },
    });
  } else if (!appUser.authUserId) {
    // Lier si pas encore lié
    appUser = await prisma.appUser.update({
      where: { id: appUser.id },
      data: { authUserId: session.user.id },
      include: { memberships: { include: { company: true } } },
    });
  }

  // 3) Vérifier l'appartenance à l'entreprise (slug)
  const membership = appUser.memberships.find((m) => m.company.slug === params.slug);
  if (!membership) notFound();

  return <div className="p-6">Dashboard Entreprise — {membership.company.name}</div>;
}