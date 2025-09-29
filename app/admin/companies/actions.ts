// app/admin/companies/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import type { CreateCompanyDTO } from "@/lib/validators/company";

export type CreateCompanyResult =
  | { ok: true; companyId: string; companySlug: string }
  | { ok: false; error: string; meta?: any };

export async function createCompany(input: CreateCompanyDTO): Promise<CreateCompanyResult> {
  try {
    const res = await prisma.$transaction(async (tx) => {
      // 1) Company
      const company = await tx.company.create({
        data: {
          name: input.name,
          slug: input.slug,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2,
          postalCode: input.postalCode,
          city: input.city,
          country: input.country,
          phone: input.phone,
          siret: input.siret,
        },
      });

      // 2) License
      await tx.license.create({
        data: {
          companyId: company.id,
          seats: input.seats,
          seatsUsed: 0,
          status: "ACTIVE",
          expiresAt:
            input.expiresAt ??
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      // 3) Owner
      const owner = await tx.appUser.upsert({
        where: { email: input.ownerEmail },
        update: {
          firstName: input.ownerFirstName,
          lastName: input.ownerLastName,
        },
        create: {
          email: input.ownerEmail,
          firstName: input.ownerFirstName,
          lastName: input.ownerLastName,
        },
      });

      // 4) OWNER membership
      await tx.companyUser.create({
        data: {
          companyId: company.id,
          appUserId: owner.id,
          role: "OWNER",
        },
      });

      return { companyId: company.id, companySlug: company.slug };
    });

    return { ok: true, ...res };
  } catch (e: any) {
    if (e?.code === "P2002") {
      return { ok: false, error: "UNIQUE_CONSTRAINT_FAILED", meta: e?.meta };
    }
    console.error("createCompany error:", e);
    return { ok: false, error: "UNKNOWN_ERROR" };
  }
}