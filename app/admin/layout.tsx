import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/get-session";
import { AdminProvider } from "@/components/providers/admin-provider";
import { SiteHeader } from "@/components/admin/nav/site-header";


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
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {children}
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
    </AdminProvider>
  )
}
