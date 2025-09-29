// app/admin/companies/actionsUpdate.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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
        license: { seats: number; expiresAt: string | null } | null; // dates en ISO string
      };
    }
  | { ok: false; error: string };

export async function getCompanyForEdit(companyId: string): Promise<GetCompanyForEditResult> {
  try {
    const c = await prisma.company.findUnique({
      where: { id: companyId },
      include: { license: true },
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
              expiresAt: c.license.expiresAt?.toISOString() ?? null,
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
    addressLine1?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    siret?: string;
    seats?: number;        // if present => update/create license
    expiresAt?: Date;      // if present => update/create license
  };
};

export async function updateCompany({ companyId, data }: UpdateCompanyInput) {
  try {
    // 1) Build "dataCompany" en ignorant les undefined
    const dataCompany: Record<string, any> = {};
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

    // 2) License : si seats et/ou expiresAt fournis -> update/create
    if (typeof data.seats !== "undefined" || typeof data.expiresAt !== "undefined") {
      const existing = await prisma.license.findUnique({ where: { companyId } });
      if (existing) {
        await prisma.license.update({
          where: { companyId },
          data: {
            seats: typeof data.seats !== "undefined" ? data.seats : existing.seats,
            expiresAt:
              typeof data.expiresAt !== "undefined" ? data.expiresAt : existing.expiresAt,
          },
        });
      } else {
        // création : on exige seats + expiresAt pour éviter un état invalide
        if (typeof data.seats === "number" && data.expiresAt instanceof Date) {
          await prisma.license.create({
            data: {
              companyId,
              seats: data.seats,
              seatsUsed: 0,
              status: "ACTIVE",
              expiresAt: data.expiresAt,
            },
          });
        } else {
          return {
            ok: false,
            error:
              "No existing license. Provide both seats and expiresAt to create a license.",
          };
        }
      }
    }

    revalidatePath("/admin/companies");
    return { ok: true };
  } catch (e: any) {
    console.error(e);
    return { ok: false, error: e?.message ?? "Failed to update company" };
  }
}