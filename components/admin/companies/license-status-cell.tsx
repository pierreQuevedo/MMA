"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { updateCompanyLicenseStatus } from "@/app/admin/companies/actionsUpdate";

type Props = {
  companyId: string;
  initial: "ACTIVE" | "SUSPENDED" | "EXPIRED" | null;
};

export function LicenseStatusCell({ companyId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Pas de licence => rien à éditer
  if (!initial) return <span className="text-muted-foreground">No license</span>;

  return (
    <Select
      defaultValue={initial}
      disabled={pending}
      onValueChange={(next) => {
        startTransition(async () => {
          const t = toast.loading("Mise à jour du statut…");
          const res = await updateCompanyLicenseStatus({
            companyId,
            status: next as any,
          });
          if (res.ok) {
            toast.success("Statut mis à jour.", { id: t });
            router.refresh(); // ⬅️ refresh immédiat de la table
          } else {
            toast.error("Échec de la mise à jour.", { id: t });
          }
        });
      }}
    >
      <SelectTrigger className="h-8 w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
        <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
        <SelectItem value="EXPIRED">EXPIRED</SelectItem>
      </SelectContent>
    </Select>
  );
}