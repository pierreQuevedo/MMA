// app/admin/companies/actionsUpdate.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { $Enums } from "@/lib/generated/prisma";

type GetCompanyForEditResult =
  | {
      ok: true;
      company: {
        id: string;
        name: string;
        slug: string;
        addressLine1: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        city: string | null;
        country: string | null;
        phone: string | null;
        siret: string | null;
        // ✅ on inclut le status dans le type retourné
        license:
          | {
              seats: number;
              expiresAt: string | null; // ISO
              status: $Enums.LicenseStatus; // "ACTIVE" | "SUSPENDED" | "EXPIRED"
            }
          | null;
      };
    }
  | { ok: false; error: string };

export async function getCompanyForEdit(
  companyId: string
): Promise<GetCompanyForEditResult> {
  try {
    const c = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        addressLine1: true,
        addressLine2: true,
        postalCode: true,
        city: true,
        country: true,
        phone: true,
        siret: true,
        license: {
          select: {
            seats: true,
            expiresAt: true,
            status: true, // ✅ on récupère le statut
          },
        },
      },
    });

    if (!c) return { ok: false, error: "Company not found" };

    return {
      ok: true,
      company: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        addressLine1: c.addressLine1 ?? null,
        addressLine2: c.addressLine2 ?? null,
        postalCode: c.postalCode ?? null,
        city: c.city ?? null,
        country: c.country ?? null,
        phone: c.phone ?? null,
        siret: c.siret ?? null,
        license: c.license
          ? {
              seats: c.license.seats,
              expiresAt: c.license.expiresAt
                ? c.license.expiresAt.toISOString()
                : null,
              status: c.license.status, // ✅ présent côté client
            }
          : null,
      },
    };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Failed to fetch company" };
  }
}

type UpdateCompanyInput = {
    companyId: string;
    data: {
      name?: string;
      slug?: string;
      addressLine1?: string | null;
      addressLine2?: string | null;
      postalCode?: string | null;
      city?: string | null;
      country?: string | null;
      phone?: string | null;
      siret?: string | null;
  
      // ⚠️ peuvent arriver en null depuis l'UI → on les ignorera
      seats?: number | null;
      expiresAt?: Date | null;
    };
  };

  export async function updateCompany({ companyId, data }: UpdateCompanyInput) {
    try {
      // 1) Update Company (ignore undefined)
      const dataCompany: Record<string, unknown> = {};
      for (const k of [
        "name",
        "slug",
        "addressLine1",
        "addressLine2",
        "postalCode",
        "city",
        "country",
        "phone",
        "siret",
      ] as const) {
        if (typeof data[k] !== "undefined") dataCompany[k] = data[k];
      }
  
      if (Object.keys(dataCompany).length > 0) {
        await prisma.company.update({
          where: { id: companyId },
          data: dataCompany,
        });
      }
  
      // 2) License : seats/expiresAt (ignorer null, n'envoyer que des valeurs valides)
      const wantsLicenseChange =
        typeof data.seats !== "undefined" || typeof data.expiresAt !== "undefined";
  
      if (wantsLicenseChange) {
        const existing = await prisma.license.findUnique({ where: { companyId } });
  
        const seatsProvided = typeof data.seats === "number";
        const expiresProvided = data.expiresAt instanceof Date;
  
        if (existing) {
          const licenseUpdate: Record<string, any> = {};
          if (seatsProvided) licenseUpdate.seats = data.seats!;
          if (expiresProvided) licenseUpdate.expiresAt = data.expiresAt!;
  
          // Ne rien envoyer si on n'a finalement pas de valeur valide
          if (Object.keys(licenseUpdate).length > 0) {
            await prisma.license.update({
              where: { companyId },
              data: licenseUpdate,
            });
          }
        } else {
          // Création stricte: on exige les deux champs non-nullables
          if (seatsProvided && expiresProvided) {
            await prisma.license.create({
              data: {
                companyId,
                seats: data.seats!,         // number
                seatsUsed: 0,
                status: "ACTIVE",
                expiresAt: data.expiresAt!,  // Date
              },
            });
          } else {
            return {
              ok: false as const,
              error:
                "No existing license. Provide both seats and expiresAt to create a license.",
            };
          }
        }
      }
  
      revalidatePath("/admin/companies");
      return { ok: true as const };
    } catch (e: any) {
      console.error(e);
      return { ok: false as const, error: e?.message ?? "Failed to update company" };
    }
  }

export async function updateCompanyLicenseStatus(input: {
  companyId: string;
  status: $Enums.LicenseStatus; // "ACTIVE" | "SUSPENDED" | "EXPIRED"
}) {
  const { companyId, status } = input;

  try {
    const existing = await prisma.license.findUnique({
      where: { companyId },
      select: { id: true },
    });

    if (!existing) {
      // Pas de licence → on ne crée pas automatiquement
      return { ok: false as const, error: "NO_LICENSE" as const };
    }

    await prisma.license.update({
      where: { companyId },
      data: { status },
    });

    revalidatePath("/admin/companies");
    return { ok: true as const };
  } catch (e) {
    console.error("updateCompanyLicenseStatus error:", e);
    return { ok: false as const, error: "SERVER_ERROR" as const };
  }
}