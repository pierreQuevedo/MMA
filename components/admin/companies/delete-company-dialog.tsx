"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import type { CompanyRow } from "@/lib/data/companies";
import { deleteCompany } from "@/app/admin/companies/actionsDelete";

type Props = {
  company: CompanyRow;
  onDeleted?: (companyId: string) => void;
};

export function DeleteCompanyDialog({ company, onDeleted }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  async function handleConfirm() {
    startTransition(async () => {
      const tId = toast.loading(`Deleting "${company.name}"…`);

      const res = await deleteCompany({ companyId: company.id });

      if (res.ok) {
        toast.success(`L'entreprise "${company.name}" a été supprimée`, { id: tId });
        setOpen(false);
        onDeleted?.(company.id);
        router.refresh(); // rafraîchit la table
      } else {
        toast.error("Failed to delete company", { id: tId, description: res.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" title="Delete company">
          <IconTrash className="mr-1 h-4 w-4" />
          Supprimer
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-6"
        // Dialog est dismissible par défaut (clic overlay / ESC).
        // Tu peux retirer ces handlers : ils sont juste ici pour être explicite.
        onEscapeKeyDown={() => !pending && setOpen(false)}
        onPointerDownOutside={() => !pending && setOpen(false)}
      >
        <DialogHeader className="gap-6">
          <DialogTitle>Voulez-vous supprimer {company.name} ?</DialogTitle>
          <DialogDescription>
            Cette action supprimera définitivement cette entreprise et les données associées
            (adhésions, licences, invitations). Les utilisateurs de l'application appartenant à cette entreprise seront
            également supprimés. Cette action ne peut pas être annulée.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}