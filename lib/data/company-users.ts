// lib/data/company-users.ts
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

export type CompanyUsersQuery = {
  page?: number;
  perPage?: number;
  q?: string;
  companyId?: string;
  role?: "OWNER" | "ADMIN" | "MEMBER";
  sort?: "createdAt" | "company" | "user" | "role";
  order?: "asc" | "desc";
};

export type CompanyUserRow = {
  id: string;
  // company
  companyId: string;
  companyName: string;
  companySlug: string;
  // user
  appUserId: string;
  userEmail: string;
  userFirstName: string | null;
  userLastName: string | null;
  // role
  role: "OWNER" | "ADMIN" | "MEMBER";
  // dates
  createdAtISO: string;
  createdAtLabel: string;
};

const frShort = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeZone: "Europe/Paris",
});

export async function getCompanyUsersPage({
  page = 1,
  perPage = 10,
  q = "",
  companyId,
  role,
  sort = "createdAt",
  order = "desc",
}: CompanyUsersQuery) {
  const skip = (page - 1) * perPage;

  const where: Prisma.CompanyUserWhereInput = {
    ...(companyId ? { companyId } : null),
    ...(role ? { role } : null),
    ...(q
      ? {
          OR: [
            { user: { email: { contains: q, mode: "insensitive" } } },
            { user: { firstName: { contains: q, mode: "insensitive" } } },
            { user: { lastName: { contains: q, mode: "insensitive" } } },
            { company: { name: { contains: q, mode: "insensitive" } } },
            { company: { slug: { contains: q, mode: "insensitive" } } },
          ],
        }
      : null),
  };

  let orderBy: Prisma.CompanyUserOrderByWithRelationInput;
  if (sort === "company") orderBy = { company: { name: order } };
  else if (sort === "user") orderBy = { user: { email: order } };
  else if (sort === "role") orderBy = { role: order };
  else orderBy = { createdAt: order };

  const [items, total] = await prisma.$transaction([
    prisma.companyUser.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
      include: {
        company: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    }),
    prisma.companyUser.count({ where }),
  ]);

  const rows: CompanyUserRow[] = items.map((cu) => ({
    id: cu.id,
    companyId: cu.company.id,
    companyName: cu.company.name,
    companySlug: cu.company.slug,
    appUserId: cu.user.id,
    userEmail: cu.user.email,
    userFirstName: cu.user.firstName ?? null,
    userLastName: cu.user.lastName ?? null,
    role: cu.role,
    createdAtISO: cu.createdAt.toISOString(),
    createdAtLabel: frShort.format(cu.createdAt),
  }));

  return { rows, total, page, perPage };
}