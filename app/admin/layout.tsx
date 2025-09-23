import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/get-session";
import { AdminProvider } from "@/components/providers/admin-provider";


import { AppSidebar } from "@/components/admin/app-sidebar"
// import { ChartAreaInteractive } from "@/components/chart-area-interactive"
// import { DataTable } from "@/components/data-table"
// import { SectionCards } from "@/components/section-cards"
// import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

// import data from "./data.json"

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
  
    const session = await getServerSession();          // lit cookies/headers côté serveur
    if (!session) redirect("/login?returnTo=/admin");  // redirect utilisable en Server Component
  
    // Map AppUser (création/liaison si besoin)
    let appUser =
      (await prisma.appUser.findFirst({ where: { authUserId: session.user.id } })) ??
      (await prisma.appUser.findUnique({ where: { email: session.user.email } }));
  
    if (!appUser) {
      appUser = await prisma.appUser.create({
        data: { email: session.user.email, authUserId: session.user.id },
      });
    } else if (!appUser.authUserId) {
      appUser = await prisma.appUser.update({
        where: { id: appUser.id },
        data: { authUserId: session.user.id },
      });
    }
  
    if (appUser.platformRole !== "SUPER_ADMIN") {
      redirect("/post-login");
    }
    
  return (
    <AdminProvider value={{ session, appUser }}>
        <SidebarProvider
        style={
            {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
        }
        >
        <AppSidebar variant="inset" />
        <SidebarInset>
            <main>{children}</main>
        </SidebarInset>
        </SidebarProvider>
    </AdminProvider>
  )
}
