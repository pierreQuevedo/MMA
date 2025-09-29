// components/admin/companies/create-company-dialog.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateCompanyForm } from "./create-company-form";

export function CreateCompanyDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Nouvelle entreprise</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une entreprise</DialogTitle>
        </DialogHeader>

        <CreateCompanyForm
          onSuccess={() => {
            setOpen(false);
            // Tu peux refresh la page/table ici (via router.refresh())
            // ou afficher un toast de succès.
          }}
        />
      </DialogContent>
    </Dialog>
  );
}