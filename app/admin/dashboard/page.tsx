import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/get-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboard() {
  // 1) Session Better Auth (headers() n'est pas async)
  const session = await getServerSession();
  if (!session) redirect("/login");

  // 2) Récupérer l'AppUser (par authUserId, sinon par email)
  let appUser =
    (await prisma.appUser.findFirst({
      where: { authUserId: session.user.id },
    })) ??
    (await prisma.appUser.findUnique({
      where: { email: session.user.email },
    }));

  // 2b) Si pas d'AppUser, on le crée à la volée
  if (!appUser) {
    appUser = await prisma.appUser.create({
      data: { email: session.user.email, authUserId: session.user.id },
    });
  } else if (!appUser.authUserId) {
    // Lier Better Auth ↔ AppUser si pas encore lié
    appUser = await prisma.appUser.update({
      where: { id: appUser.id },
      data: { authUserId: session.user.id },
    });
  }

  // 3) Vérifier le rôle plateforme
  if (appUser.platformRole !== "SUPER_ADMIN") {
    redirect("/post-login");
  }

  // 4) Rendu – stub à remplacer par ta vraie UI
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard Super Admin</h1>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <h2 className="font-medium">Entreprises</h2>
          <p className="text-sm text-muted-foreground">
            Liste, création, suspension, licences…
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-medium">Licences</h2>
          <p className="text-sm text-muted-foreground">
            Seats utilisés, expirations, actions rapides.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-medium">Journal d’audit</h2>
          <p className="text-sm text-muted-foreground">
            Invitations massives, changements de rôles, etc.
          </p>
        </div>
      </section>
    </main>
  );
}