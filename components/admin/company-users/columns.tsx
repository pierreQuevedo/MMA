"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { CompanyUserRow } from "@/lib/data/company-users";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconTrash } from "@tabler/icons-react";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { deleteCompanyUser, updateCompanyUserRole } from "@/app/admin/company-users/actions";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

function RoleCell({ row }: { row: CompanyUserRow }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Select
      defaultValue={row.role}
      disabled={pending}
      onValueChange={(next) => {
        start(async () => {
          const t = toast.loading("Mise à jour du rôle...");
          const res = await updateCompanyUserRole({ companyUserId: row.id, role: next as any });
          if (res.ok) {
            toast.success("Rôle mis à jour.", { id: t });
            router.refresh();
          } else {
            toast.error("Update failed.", { id: t });
          }
        });
      }}
    >
      <SelectTrigger className="h-8 w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="OWNER">OWNER</SelectItem>
        <SelectItem value="ADMIN">ADMIN</SelectItem>
        <SelectItem value="MEMBER">MEMBER</SelectItem>
      </SelectContent>
    </Select>
  );
}

function DeleteMemberDialog({ row }: { row: CompanyUserRow }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" title="Delete company">
          <IconTrash className="mr-1 h-4 w-4" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="gap-6">
        <AlertDialogHeader className="gap-6">
          <AlertDialogTitle>Voulez-vous supprimer {row.userEmail} ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action supprimera <b>{row.userEmail}</b> de <b>{row.companyName}</b>.
            Si l'utilisateur n'a pas d'autres entreprise(s), son AppUser sera supprimé.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="p-0"
            onClick={() =>
              start(async () => {
                const t = toast.loading("Suppression...");
                const res = await deleteCompanyUser(row.id);
                if (res.ok) {
                  toast.success("Membre supprimé.", { id: t });
                  router.refresh();
                } else {
                  toast.error("Delete failed.", { id: t });
                }
              })
            }
          >
            <Button variant="destructive" disabled={pending}>
              Confirmer   
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const companyUserColumns: ColumnDef<CompanyUserRow>[] = [
  {
    accessorKey: "userEmail",
    header: "Email",
    cell: ({ row }) => <span className="font-medium">{row.original.userEmail}</span>,
  },
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      const { userFirstName, userLastName } = row.original;
      const label = [userFirstName, userLastName].filter(Boolean).join(" ") || "—";
      return <span>{label}</span>;
    },
  },
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => (
      <span className="underline-offset-2 hover:underline">
        {row.original.companyName}
      </span>
    ),
  },
  {
    id: "role",
    header: "Role",
    cell: ({ row }) => <RoleCell row={row.original} />,
  },
  {
    accessorKey: "createdAtLabel",
    header: "Joined",
    cell: ({ row }) => (
      <time dateTime={row.original.createdAtISO} suppressHydrationWarning>
        {row.original.createdAtLabel}
      </time>
    ),
  },
  {
    id: "actions",
    header: () => null,
    cell: ({ row }) => (
      <div className="flex gap-2 justify-end">
        {/* Tu peux ajouter un EditSheet si tu veux plus tard */}
        <DeleteMemberDialog row={row.original} />
      </div>
    ),
    enableSorting: false,
  },
];