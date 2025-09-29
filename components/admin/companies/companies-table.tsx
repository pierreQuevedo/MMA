"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter, useSearchParams } from "next/navigation";

import type { CompanyRow } from "@/lib/data/companies";
import { companyColumns } from "./columns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

type Props = {
  data: {
    rows: CompanyRow[];
    total: number;
    page: number;
    perPage: number;
  };
};

export function CompaniesTable({ data }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [query, setQuery] = React.useState<string>(String(searchParams.get("q") ?? ""));

  const table = useReactTable<CompanyRow>({
    data: data.rows,
    columns: companyColumns,
    state: { sorting, columnFilters, rowSelection },
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);

      // Met à jour l’URL pour déclencher le re-fetch côté serveur
      const url = new URL(window.location.href);
      const param = next[0];
      if (param) {
        url.searchParams.set("sort", String(param.id));
        url.searchParams.set("order", param.desc ? "desc" : "asc");
      } else {
        url.searchParams.delete("sort");
        url.searchParams.delete("order");
      }
      url.searchParams.set("page", "1");
      router.push(url.toString());
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    // ✅ Callback partagée aux colonnes via table.options.meta
    meta: {
      onOpen: (row: CompanyRow) => {
        // Choisis l’action que tu préfères :
        // 1) Navigation vers une page détail :
        router.push(`/admin/companies/${row.slug}`);

        // 2) Ou, temporairement, un simple alert :
        // alert(`Company: ${row.name}`);
      },
    },
  });

  function goTo(page: number) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    router.push(url.toString());
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set("q", query);
    url.searchParams.set("page", "1");
    router.push(url.toString());
  }

  const pageCount = Math.ceil(data.total / data.perPage) || 1;

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <form onSubmit={applySearch} className="flex gap-2">
          <Input
            placeholder="Search name or slug…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" variant="outline">Chercher</Button>
        </form>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    onClick={() => {
                      // Tri simple au clic sur l’en-tête
                      const id = h.column.id ?? (h.column.columnDef as any).accessorKey;
                      if (!id) return;
                      const existing = sorting[0];
                      const desc = existing?.id === id ? !existing.desc : false;
                      setSorting([{ id, desc }]);
                    }}
                    className="cursor-pointer select-none"
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={companyColumns.length}>No results.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data.rows.length} / {data.total} rows
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => goTo(1)} disabled={data.page <= 1}>
            First
          </Button>
          <Button variant="outline" size="sm" onClick={() => goTo(data.page - 1)} disabled={data.page <= 1}>
            Prev
          </Button>
          <span className="text-sm px-2">Page {data.page} / {pageCount}</span>
          <Button variant="outline" size="sm" onClick={() => goTo(data.page + 1)} disabled={data.page >= pageCount}>
            Next
          </Button>
          <Button variant="outline" size="sm" onClick={() => goTo(pageCount)} disabled={data.page >= pageCount}>
            Last
          </Button>
        </div>
      </div>
    </div>
  );
}