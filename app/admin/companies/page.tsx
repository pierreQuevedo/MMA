// app/admin/companies/page.tsx
import { getCompaniesPage, type CompaniesQuery } from "@/lib/data/companies";
import { CompaniesTable } from "@/components/admin/companies/companies-table";
import { CreateCompanyDialog } from "@/components/admin/companies/create-company-dialog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function sp(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = searchParams[key];
  return Array.isArray(v) ? v[0] : v;
}
const toNum = (v: string | undefined, fallback: number) =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;

const asSort = (v?: string): CompaniesQuery["sort"] => {
  const allowed = ["name", "slug", "createdAt", "updatedAt", "status", "seatsUsed"] as const;
  return (allowed as readonly string[]).includes(v ?? "") ? (v as CompaniesQuery["sort"]) : "createdAt";
};

const asOrder = (v?: string): CompaniesQuery["order"] =>
  v === "asc" || v === "desc" ? v : "desc";

const asStatus = (v?: string): CompaniesQuery["status"] => {
  const allowed = ["ACTIVE", "SUSPENDED", "EXPIRED", "NONE", ""] as const;
  return (allowed as readonly string[]).includes(v ?? "")
    ? ((v ?? "") as CompaniesQuery["status"])
    : "";
};

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // pagination & tri
  const page = toNum(sp(searchParams, "page"), 1);
  const perPage = toNum(sp(searchParams, "perPage"), 10);
  const q = sp(searchParams, "q") ?? "";
  const sort = asSort(sp(searchParams, "sort"));
  const order = asOrder(sp(searchParams, "order"));

  // filtres
  const status = asStatus(sp(searchParams, "status"));
  const withLicense = ["1", "true", "yes"].includes((sp(searchParams, "withLicense") ?? "").toLowerCase());
  const country = sp(searchParams, "country") ?? "";
  const seatsMin = sp(searchParams, "seatsMin");
  const seatsMax = sp(searchParams, "seatsMax");

  const data = await getCompaniesPage({
    page,
    perPage,
    q,
    sort,
    order,
    status,
    withLicense,
    country,
    seatsMin: seatsMin ? Number(seatsMin) : undefined,
    seatsMax: seatsMax ? Number(seatsMax) : undefined,
  });

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