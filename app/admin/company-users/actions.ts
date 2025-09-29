"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { $Enums } from "@/lib/generated/prisma";

/** CREATE (ou upsert si même couple companyId/email) */
export async function createCompanyUser(input: {
  companyId: string;
  role: $Enums.CompanyRole; // "OWNER" | "ADMIN" | "MEMBER"
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  try {
    // 1) AppUser par email (create si absent)
    const appUser =
      (await prisma.appUser.findUnique({ where: { email: input.email } })) ??
      (await prisma.appUser.create({
        data: {
          email: input.email,
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
        },
      }));

    // 2) Upsert membership (unique companyId+appUserId)
    await prisma.companyUser.upsert({
      where: { companyId_appUserId: { companyId: input.companyId, appUserId: appUser.id } },
      update: { role: input.role },
      create: { companyId: input.companyId, appUserId: appUser.id, role: input.role },
    });

    revalidatePath("/admin/company-users");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "CREATE_FAILED" as const };
  }
}

/** UPDATE (role) */
export async function updateCompanyUserRole(input: {
  companyUserId: string;
  role: $Enums.CompanyRole;
}) {
  try {
    await prisma.companyUser.update({
      where: { id: input.companyUserId },
      data: { role: input.role },
    });
    revalidatePath("/admin/company-users");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "UPDATE_FAILED" as const };
  }
}

/** DELETE (et cleanup AppUser orphelin) */
export async function deleteCompanyUser(companyUserId: string) {
  try {
    const cu = await prisma.companyUser.findUnique({
      where: { id: companyUserId },
      select: { appUserId: true },
    });
    if (!cu) return { ok: true as const };

    await prisma.$transaction(async (tx) => {
      await tx.companyUser.delete({ where: { id: companyUserId } });
      // Supprime l’AppUser s’il n’a plus aucune membership
      await tx.appUser.deleteMany({
        where: { id: cu.appUserId, memberships: { none: {} } },
      });
    });

    revalidatePath("/admin/company-users");
    return { ok: true as const };
  } catch (e) {
    console.error(e);
    return { ok: false as const, error: "DELETE_FAILED" as const };
  }
}