"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { CompanyRow } from "@/lib/data/companies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteCompany } from "@/app/admin/companies/actionsDelete";
import { DeleteCompanyDialog } from "./delete-company-dialog";

function RowActions({ company }: { company: CompanyRow }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  async function handleDelete() {
    if (!confirm(`Delete "${company.name}"? This cannot be undone.`)) return;

    const res = await deleteCompany({ companyId: company.id }); // ou deleteCompany(company.id, { deleteAllMembers: true })
    if (!res.ok) {
      alert("Failed to delete company. Please try again.");
      return;
    }

    // côté serveur on a revalidatePath("/admin/companies"),
    // côté client on refresh pour UX immédiate :
    router.refresh();
  }

  return (
    <div className="flex gap-2 justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={() => alert(`Edit ${company.name}`)}
      >
        Edit
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => startTransition(() => { void handleDelete(); })}
        disabled={isPending}
      >
        {isPending ? "Deleting…" : "Delete"}
      </Button>
    </div>
  );
}

export const companyColumns: ColumnDef<CompanyRow>[] = [
  {
    id: "select",
    header: () => null,
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 32,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row, table }) => (
      <button
        className="text-left underline-offset-2 hover:underline"
        onClick={() =>
          (table.options.meta as { onOpen?: (r: CompanyRow) => void })?.onOpen?.(
            row.original
          )
        }
      >
        {row.original.name}
      </button>
    ),
  },
  { accessorKey: "slug", header: "Slug" },
  {
    id: "members",
    header: "Members",
    accessorFn: (r) => r.usersCount,
  },
  {
    id: "seats",
    header: "Seats",
    accessorFn: (r) =>
      r.licenseSeats !== null && r.licenseSeatsUsed !== null
        ? `${r.licenseSeatsUsed} / ${r.licenseSeats}`
        : "—",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const st = row.original.licenseStatus;
      if (!st) return <span className="text-muted-foreground">No license</span>;
      return <Badge variant="outline">{st}</Badge>;
    },
  },
  {
    accessorKey: "createdAtLabel",
    header: "Créée le",
    cell: ({ row }) => (
      <time dateTime={row.original.createdAtISO} suppressHydrationWarning>
        {row.original.createdAtLabel}
      </time>
    ),
  },
  {
    accessorKey: "updatedAtLabel",
    header: "MAJ le",
    cell: ({ row }) => (
      <time dateTime={row.original.updatedAtISO} suppressHydrationWarning>
        {row.original.updatedAtLabel}
      </time>
    ),
  },
  {
    id: "actions",
    header: () => null,
    cell: ({ row }) => (
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => alert(`Edit ${row.original.name}`)}
        >
          Modifier
        </Button>
        <DeleteCompanyDialog company={row.original} />
      </div>
    ),
    enableSorting: false,
  },
];