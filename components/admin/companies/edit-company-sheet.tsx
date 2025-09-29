// components/admin/companies/edit-company-sheet.tsx
"use client";

import * as React from "react";
import { useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconPencil } from "@tabler/icons-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { updateCompanyLicenseStatus } from "@/app/admin/companies/actionsUpdate";

import {
  CompanyEditUISchema,
  type CompanyEditFormInput,
  normalizeCompanyEditValues,
} from "@/lib/validators/company";
import {
  getCompanyForEdit,
  updateCompany,
} from "@/app/admin/companies/actionsUpdate";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function toDateInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Props = {
  companyId: string;
  trigger?: React.ReactNode; // si tu veux personnaliser le bouton
};

export function EditCompanySheet({ companyId, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const [licenseStatus, setLicenseStatus] =
  React.useState<"ACTIVE" | "SUSPENDED" | "EXPIRED" | null>(null);

  const form = useForm<CompanyEditFormInput>({
    defaultValues: {
      name: "",
      slug: "",
      addressLine1: "",
      addressLine2: "",
      postalCode: "",
      city: "",
      country: "FR",
      phone: "",
      siret: "",
      seats: "", // string UI
      expiresAt: "", // "yyyy-mm-dd"
    },
    mode: "onSubmit",
  });

  // Charger les valeurs quand le Sheet s’ouvre
  useEffect(() => {
    if (!open) return;
    (async () => {
      const tId = toast.loading("Chargement des informations…");
      const res = await getCompanyForEdit(companyId);
      if (!res.ok) {
        toast.error(res.error, { id: tId });
        return;
      }
      const c = res.company;

      form.reset({
        name: c.name ?? "",
        slug: c.slug ?? "",
        addressLine1: c.addressLine1 ?? "",
        addressLine2: c.addressLine2 ?? "",
        postalCode: c.postalCode ?? "",
        city: c.city ?? "",
        country: c.country ?? "FR",
        phone: c.phone ?? "",
        siret: c.siret ?? "",
        seats: c.license ? String(c.license.seats) : "",
        expiresAt: toDateInput(c.license?.expiresAt ?? null),
      });

      setLicenseStatus(c.license?.status ?? null);
      toast.dismiss(tId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companyId]);

  const onSubmit = (values: CompanyEditFormInput) => {
    startTransition(() => {
      (async () => {
        const parsed = CompanyEditUISchema.parse(values);
        const normalized = normalizeCompanyEditValues(parsed);

        const tId = toast.loading("Mise à jour en cours…");

        const res = await updateCompany({ companyId, data: normalized });
        if (res.ok) {
          toast.success("Entreprise mise à jour", { id: tId });
          setOpen(false);
          router.refresh();
        } else {
          toast.error(res.error ?? "Échec de la mise à jour", { id: tId });
        }
      })();
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <IconPencil className="mr-1" />
            Modifier
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit company</SheetTitle>
          <SheetDescription>
            Modifie les informations de l’entreprise. Laisse vide ce que tu ne
            veux pas changer.
          </SheetDescription>
        </SheetHeader>

        <div className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <h3 className="text-lg font-semibold">Company</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address line 1</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressLine2"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address line 2</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="siret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SIRET</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <h3 className="text-lg font-semibold">License</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col md:col-span-2 gap-2">
                    <FormLabel>License status</FormLabel>
                    <LicenseStatusEditor companyId={companyId} initial={licenseStatus} />
                </div>
                <FormField
                  control={form.control}
                  name="seats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seats</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires at</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="gap-2 flex">
                <SheetClose asChild>
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Chargement..." : "Sauvegarder"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LicenseStatusEditor({
    companyId,
    initial,
  }: {
    companyId: string;
    initial: "ACTIVE" | "SUSPENDED" | "EXPIRED" | null;
  }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
  
    if (!initial) {
      return <span className="text-muted-foreground">No license</span>;
    }
  
    return (
      <Select
        defaultValue={initial}
        onValueChange={(next) => {
          startTransition(async () => {
            const t = toast.loading("Updating license status…");
            const res = await updateCompanyLicenseStatus({
              companyId,
              status: next as "ACTIVE" | "SUSPENDED" | "EXPIRED",
            });
            if (res.ok) {
              toast.success("Status updated.", { id: t });
              router.refresh();
            } else {
              toast.error("Update failed.", { id: t });
            }
          });
        }}
        disabled={pending}
      >
        <SelectTrigger className="h-8 w-[180px]">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
          <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
          <SelectItem value="EXPIRED">EXPIRED</SelectItem>
        </SelectContent>
      </Select>
    );
  }