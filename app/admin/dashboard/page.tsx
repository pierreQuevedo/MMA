"use client"
import { useAdmin } from "@/components/providers/admin-provider";
import { SectionCards } from "@/components/admin/section-cards";
import { ChartAreaInteractive } from "@/components/admin/chart-area-interactive";
import { DataTable } from "@/components/admin/data-table";

import data from "./data.json"

export default function AdminDashboard() {

  const { session, appUser } = useAdmin();

  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  );
}