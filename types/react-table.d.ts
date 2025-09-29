// types/react-table.d.ts
import type { RowData } from "@tanstack/table-core";

declare module "@tanstack/table-core" {
  interface TableMeta<TData extends RowData> {
    onOpen?: (row: TData) => void;
  }
}