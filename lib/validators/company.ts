// lib/validators/company.ts
import { z } from "zod";

/**
 * Schéma côté UI (ce que les <input> renvoient)
 * - seats: string (depuis <input type="number">)
 * - expiresAt: string "yyyy-mm-dd" ou "" (depuis <input type="date">)
 */
export const CompanyFormUISchema = z.object({
  // Company
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase, numbers and dashes"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(2, "Postal code is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().default("FR"),
  phone: z.string().optional(),
  siret: z.string().optional(),

  // Owner (AppUser)
  ownerEmail: z.string().email(),
  ownerFirstName: z.string().min(1, "First name is required"),
  ownerLastName: z.string().min(1, "Last name is required"),

  // License
  seats: z
    .string()
    .regex(/^\d+$/, "Seats must be a positive integer")
    .transform((s) => Number(s)), // string -> number

  // "" | undefined -> undefined; "2025-12-01" -> Date
  expiresAt: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() !== "" ? new Date(s) : undefined)),
});

/** Types */
export type CompanyFormInput = z.input<typeof CompanyFormUISchema>; // types attendus dans le form (strings)
export type CompanyFormValues = z.output<typeof CompanyFormUISchema>; // types résolus après transform (number / Date|undefined)

/** DTO attendu par la server action */
export type CreateCompanyDTO = {
  name: string;
  slug: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone: string | null;
  siret: string | null;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  seats: number;
  expiresAt: Date | null;
};

/** Normalisation explicite pour la server action */
export function normalizeCompanyFormValues(
  v: CompanyFormValues
): CreateCompanyDTO {
  return {
    name: v.name,
    slug: v.slug,
    addressLine1: v.addressLine1,
    addressLine2: v.addressLine2 || null,
    postalCode: v.postalCode,
    city: v.city,
    country: v.country || "FR",
    phone: v.phone || null,
    siret: v.siret || null,
    ownerEmail: v.ownerEmail,
    ownerFirstName: v.ownerFirstName,
    ownerLastName: v.ownerLastName,
    seats: v.seats, // number
    expiresAt: v.expiresAt ?? null, // Date | null
  };
}

/** alias facultatif si du code existant importe `companyFormSchema` */
export const companyFormSchema = CompanyFormUISchema;

// ======= EDIT (UI) =======

export const CompanyEditUISchema = z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    siret: z.string().optional(),
    seats: z
      .string()
      .regex(/^\d+$/)
      .transform((s) => Number(s))
      .optional(),
    expiresAt: z
      .string()
      .optional()
      .transform((s) => (s ? new Date(s) : undefined)),
  });
  export type CompanyEditFormInput = z.input<typeof CompanyEditUISchema>;
  export type CompanyEditFormValues = z.output<typeof CompanyEditUISchema>;
  
  export function normalizeCompanyEditValues(v: CompanyEditFormValues) {
    return {
      name: v.name,
      slug: v.slug,
      addressLine1: v.addressLine1,
      addressLine2: v.addressLine2 ?? undefined,
      postalCode: v.postalCode,
      city: v.city,
      country: v.country,
      phone: v.phone ?? undefined,
      siret: v.siret ?? undefined,
      seats: v.seats,               // number | undefined
      expiresAt: v.expiresAt ?? undefined, // Date | undefined
    };
  }