import { prisma } from "@/lib/prisma";
import { getCompanyUsersPage } from "@/lib/data/company-users";
import { CompanyUsersTable } from "@/components/admin/company-users/company-users-table";
import { CreateCompanyUserDialog } from "@/components/admin/company-users/create-company-user-dialog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CompanyUsersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const page = Number(searchParams.page ?? 1);
  const perPage = Number(searchParams.perPage ?? 10);
  const q = (searchParams.q ?? "") as string;
  const companyId = (searchParams.companyId ?? "") as string;
  const role = (searchParams.role ?? "") as "OWNER" | "ADMIN" | "MEMBER" | "";
  const sort = (searchParams.sort ?? "createdAt") as any;
  const order = (searchParams.order ?? "desc") as any;

  const data = await getCompanyUsersPage({
    page,
    perPage,
    q,
    companyId: companyId || undefined,
    role: (role as any) || undefined,
    sort,
    order,
  });

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Company Members</h1>
        <CreateCompanyUserDialog companies={companies} />
      </div>
      <CompanyUsersTable data={data} companies={companies} />
    </main>
  );
}