// schemas/company-create.ts
import { z } from "zod";

export const CompanyCreateSchema = z.object({
  // Company
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis"),
  addressLine1: z.string().min(2, "Adresse requise"),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(2, "Code postal requis"),
  city: z.string().min(2, "Ville requise"),
  country: z.string().default("FR"), // <- output: string
  phone: z.string().optional(),
  siret: z.string().optional(),

  // Owner (AppUser)
  ownerEmail: z.string().email("Email invalide"),
  ownerFirstName: z.string().min(1, "Prénom requis"),
  ownerLastName: z.string().min(1, "Nom requis"),

  // License
  seats: z.coerce.number().int().min(1, "≥ 1 seat"),
  expiresAt: z
    .union([z.string().datetime().transform((s) => new Date(s)), z.literal("")])
    .transform((v) => (v === "" ? null : v)) // output: Date | null
    .optional(),
});

export type CompanyCreateInput = z.output<typeof CompanyCreateSchema>;