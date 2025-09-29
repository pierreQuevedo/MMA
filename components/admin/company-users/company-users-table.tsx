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
import type { CompanyUserRow } from "@/lib/data/company-users";
import { companyUserColumns } from "./columns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";

type Props = {
  data: { rows: CompanyUserRow[]; total: number; page: number; perPage: number };
  companies: { id: string; name: string }[];
};

export function CompanyUsersTable({ data, companies }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters] = React.useState<ColumnFiltersState>([]);
  const [q, setQ] = React.useState<string>(String(sp.get("q") ?? ""));
  const [companyId, setCompanyId] = React.useState<string>(String(sp.get("companyId") ?? ""));
  const [role, setRole] = React.useState<string>(String(sp.get("role") ?? ""));

  const table = useReactTable<CompanyUserRow>({
    data: data.rows,
    columns: companyUserColumns,
    state: { sorting, columnFilters },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
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
  });

  function applyFilters() {
    const url = new URL(window.location.href);
    q ? url.searchParams.set("q", q) : url.searchParams.delete("q");
    companyId ? url.searchParams.set("companyId", companyId) : url.searchParams.delete("companyId");
    role ? url.searchParams.set("role", role) : url.searchParams.delete("role");
    url.searchParams.set("page", "1");
    router.push(url.toString());
  }

  function goTo(page: number) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    router.push(url.toString());
  }

  const pageCount = Math.ceil(data.total / data.perPage) || 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Search email/name/company…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All roles</SelectItem>
                <SelectItem value="OWNER">OWNER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="MEMBER">MEMBER</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">Filter</Button>
          </form>
        </div>
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
                      const id = h.column.id ?? (h.column.columnDef as any).accessorKey;
                      if (!id) return;
                      const existing = sorting[0];
                      const desc = existing?.id === id ? !existing.desc : false;
                      setSorting([{ id, desc }]);
                    }}
                    className="cursor-pointer select-none"
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={companyUserColumns.length}>No results.</TableCell>
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