// app/admin/companies/actions.ts
"use server";

import { prisma } from "@/lib/prisma";

/**
 * Supprime une company + relations directes (CompanyUser, License, Invite via ON DELETE CASCADE),
 * puis supprime les AppUser devenus orphelins (sans aucune membership).
 */
export async function deleteCompany(input: { companyId: string }) {
  const { companyId } = input;

  try {
    await prisma.$transaction(async (tx) => {
      // 1) collecter les appUser liés à cette company
      const memberships = await tx.companyUser.findMany({
        where: { companyId },
        select: { appUserId: true },
      });
      const appUserIds = Array.from(new Set(memberships.map((m) => m.appUserId)));

      // 2) suppression de la company (cascade: CompanyUser, License, Invite grâce aux relations Prisma)
      await tx.company.delete({ where: { id: companyId } });

      // 3) suppression des AppUser orphelins (ceux qui n’ont plus de membership)
      if (appUserIds.length > 0) {
        await tx.appUser.deleteMany({
          where: {
            id: { in: appUserIds },
            memberships: { none: {} },
          },
        });
      }
    });

    return { ok: true as const };
  } catch (err: any) {
    console.error("deleteCompany error:", err);
    return { ok: false as const, error: "FAILED_TO_DELETE", meta: String(err?.message ?? err) };
  }
}