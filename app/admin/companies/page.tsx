// app/admin/companies/page.tsx
import { getCompaniesPage } from "@/lib/data/companies";
import { CompaniesTable } from "@/components/admin/companies/companies-table";
import { CreateCompanyDialog } from "@/components/admin/companies/create-company-dialog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const page = Number(searchParams.page ?? 1);
  const perPage = Number(searchParams.perPage ?? 10);
  const q = (searchParams.q ?? "") as string;
  const sort = (searchParams.sort ?? "createdAt") as any;
  const order = (searchParams.order ?? "desc") as any;

  const data = await getCompaniesPage({ page, perPage, q, sort, order });

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Entreprises</h1>
        <CreateCompanyDialog />
      </div>
      <CompaniesTable data={data} />
    </main>
  );
}