"use client"
import { useAdmin } from "@/components/providers/admin-provider";

export default function AdminDashboard() {

  const { session, appUser } = useAdmin();

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard Super Admin {appUser.email}</h1>

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