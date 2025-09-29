// components/admin/companies/create-company-form.tsx
"use client";

import * as React from "react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  CompanyFormUISchema,
  type CompanyFormInput,
  normalizeCompanyFormValues,
} from "@/lib/validators/company";
import { createCompany } from "@/app/admin/companies/actions";

import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Props = { onSuccess?: (r: { companyId: string; companySlug: string }) => void };

export function CreateCompanyForm({ onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CompanyFormInput>({
    defaultValues: {
      // Company
      name: "",
      slug: "",
      addressLine1: "",
      addressLine2: "",
      postalCode: "",
      city: "",
      country: "FR",
      phone: "",
      siret: "",
      // Owner
      ownerEmail: "",
      ownerFirstName: "",
      ownerLastName: "",
      // License
      seats: "1",       // string (on garde RHF en string côté UI)
      expiresAt: "",    // string "yyyy-mm-dd"
    },
    mode: "onSubmit",
  });

  const onSubmit = (values: CompanyFormInput) => {
    startTransition(async () => {
      // 1) Validation côté client (Zod) + transform
      const parsed = CompanyFormUISchema.safeParse(values);

      if (!parsed.success) {
        // ✅ typage fort sur fieldErrors (évite le '{}' qui te donnait les erreurs "length" & index 0)
        const { fieldErrors } = parsed.error.flatten();
        (Object.entries(fieldErrors) as [keyof CompanyFormInput, string[] | undefined][])
          .forEach(([name, messages]) => {
            if (messages?.[0]) {
              form.setError(name, { type: "zod", message: messages[0] });
            }
          });
        return;
      }

      // 2) Normalisation en DTO serveur (number/Date|null)
      const dto = normalizeCompanyFormValues(parsed.data);

      // 3) Appel server action
      const res = await createCompany(dto);

      if (res.ok) {
        onSuccess?.({ companyId: res.companyId, companySlug: res.companySlug });
        form.reset();
      } else {
        // mapping d’erreur simple
        form.setError("slug", {
          type: "server",
          message:
            res.error === "UNIQUE_CONSTRAINT_FAILED"
              ? "Slug (ou un autre champ unique) existe déjà."
              : "Une erreur est survenue.",
        });
      }
    });
  };

  return (
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
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <h3 className="text-lg font-semibold">Owner</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="ownerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ownerFirstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ownerLastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <h3 className="text-lg font-semibold">License</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="seats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seats</FormLabel>
                <FormControl>
                  {/* ⚠️ on garde une string côté UI */}
                  <Input type="number" inputMode="numeric" min={1} {...field} />
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
                  {/* string "yyyy-mm-dd" (vide autorisé) */}
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create company"}
          </Button>
        </div>
      </form>
    </Form>
  );
}