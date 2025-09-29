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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

  // états table
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  // recherche
  const [query, setQuery] = React.useState<string>(
    String(searchParams.get("q") ?? "")
  );

  // --- Filtres (synchro avec URL) ---
  const [status, setStatus] = React.useState<string>(
    searchParams.get("status") ?? ""
  );
  const [withLicense, setWithLicense] = React.useState<boolean>(
    (searchParams.get("withLicense") ?? "") === "1"
  );
  const [country, setCountry] = React.useState<string>(
    searchParams.get("country") ?? ""
  );
  const [seatsMin, setSeatsMin] = React.useState<string>(
    searchParams.get("seatsMin") ?? ""
  );
  const [seatsMax, setSeatsMax] = React.useState<string>(
    searchParams.get("seatsMax") ?? ""
  );

  const table = useReactTable<CompanyRow>({
    data: data.rows,
    columns: companyColumns,
    state: { sorting, columnFilters, rowSelection },
    onRowSelectionChange: setRowSelection,
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

    meta: {
      onOpen: (row: CompanyRow) => {
        router.push(`/admin/companies/${row.slug}`);
      },
    },
  });

  function pushQueryParams(base?: URL) {
    const url = base ?? new URL(window.location.href);

    // recherche
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");

    // filtres
    if (status) url.searchParams.set("status", status);
    else url.searchParams.delete("status");

    if (withLicense) url.searchParams.set("withLicense", "1");
    else url.searchParams.delete("withLicense");

    if (country) url.searchParams.set("country", country);
    else url.searchParams.delete("country");

    if (seatsMin) url.searchParams.set("seatsMin", seatsMin);
    else url.searchParams.delete("seatsMin");

    if (seatsMax) url.searchParams.set("seatsMax", seatsMax);
    else url.searchParams.delete("seatsMax");

    // pagination → reset page
    url.searchParams.set("page", "1");
    return url;
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(pushQueryParams().toString());
  }

  function resetFilters() {
    setStatus("");
    setWithLicense(false);
    setCountry("");
    setSeatsMin("");
    setSeatsMax("");
    setQuery("");

    const url = new URL(window.location.href);
    ["q", "status", "withLicense", "country", "seatsMin", "seatsMax"].forEach(
      (k) => url.searchParams.delete(k)
    );
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
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        {/* Bloc recherche */}
        <form onSubmit={applySearch} className="flex gap-2">
          <Input
            placeholder="Search name or slug…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" variant="outline">
            Chercher
          </Button>
        </form>

        {/* Bloc filtres */}
        <div className="flex flex-wrap items-end gap-2">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                <SelectItem value="EXPIRED">EXPIRED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Country</Label>
            <Input
              className="w-[120px]"
              placeholder="FR"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>

          {/* Seats range */}
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Seats ≥</Label>
            <Input
              className="w-[90px]"
              type="number"
              inputMode="numeric"
              min={0}
              value={seatsMin}
              onChange={(e) => setSeatsMin(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Seats ≤</Label>
            <Input
              className="w-[90px]"
              type="number"
              inputMode="numeric"
              min={0}
              value={seatsMax}
              onChange={(e) => setSeatsMax(e.target.value)}
            />
          </div>

          {/* With license */}
          <div className="flex items-center gap-2 pt-5">
            <Checkbox
              id="withLicense"
              checked={withLicense}
              onCheckedChange={(v) => setWithLicense(Boolean(v))}
            />
            <Label htmlFor="withLicense" className="text-sm">
              Avec licence
            </Label>
          </div>

          <Button variant="ghost" onClick={resetFilters}>
            Reset
          </Button>
          <Button onClick={() => router.push(pushQueryParams().toString())}>
            Appliquer
          </Button>
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
                      const id =
                        h.column.id ?? (h.column.columnDef as any).accessorKey;
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={companyColumns.length}>
                  No results.
                </TableCell>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(1)}
            disabled={data.page <= 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(data.page - 1)}
            disabled={data.page <= 1}
          >
            Prev
          </Button>
          <span className="text-sm px-2">
            Page {data.page} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(data.page + 1)}
            disabled={data.page >= pageCount}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(pageCount)}
            disabled={data.page >= pageCount}
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
}
