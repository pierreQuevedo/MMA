// lib/data/companies.ts
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/** Paramètres de requête pour la liste des companies */
export type CompaniesQuery = {
  page?: number;
  perPage?: number;
  q?: string;
  /** tri (alias inclus) */
  sort?: "name" | "slug" | "createdAt" | "updatedAt" | "status" | "seatsUsed";
  order?: "asc" | "desc";

  // --- Nouveaux filtres ---
  status?: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "NONE" | ""; // NONE = sans licence
  withLicense?: boolean;
  country?: string;
  seatsMin?: number;
  seatsMax?: number;
};

/** Ligne sérialisée (RSC-friendly) */
export type CompanyRow = {
  id: string;
  name: string;
  slug: string;

  // Dates -> ISO + label FR côté serveur (stable pour l'hydratation)
  createdAtISO: string;
  createdAtLabel: string;
  updatedAtISO: string;
  updatedAtLabel: string;

  // Champs flatten issus de License (peuvent être null si pas de license)
  licenseStatus: "ACTIVE" | "SUSPENDED" | "EXPIRED" | null;
  licenseSeats: number | null;
  licenseSeatsUsed: number | null;
  licenseExpiresAtISO: string | null;
  licenseExpiresAtLabel: string | null;

  // Compteurs utiles
  usersCount: number;
  invitesCount: number;
};

// Formatter déterministe (même rendu SSR/Client)
const frShort = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeZone: "Europe/Paris",
});

/** Page de données (tri/filtre/pagination côté serveur) */
export async function getCompaniesPage({
  page = 1,
  perPage = 10,
  q = "",
  sort = "createdAt",
  order = "desc",

  // filtres
  status = "",
  withLicense = false,
  country = "",
  seatsMin,
  seatsMax,
}: CompaniesQuery) {
  const skip = (page - 1) * perPage;

  // Construire dynamiquement les conditions
  const AND: Prisma.CompanyWhereInput[] = [];

  if (q) {
    AND.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (country) {
    AND.push({ country: { equals: country } });
  }

  if (withLicense) {
    AND.push({ license: { isNot: null } });
  }

  if (status) {
    if (status === "NONE") {
      AND.push({ license: { is: null } });
    } else {
      AND.push({ license: { is: { status } } });
    }
  }

  if (typeof seatsMin === "number") {
    AND.push({ license: { is: { seats: { gte: seatsMin } } } });
  }
  if (typeof seatsMax === "number") {
    AND.push({ license: { is: { seats: { lte: seatsMax } } } });
  }

  const where: Prisma.CompanyWhereInput | undefined = AND.length ? { AND } : undefined;

  // orderBy sûr (y compris champs liés)
  let orderBy: Prisma.CompanyOrderByWithRelationInput;
  if (sort === "status") {
    orderBy = { license: { status: order } };
  } else if (sort === "seatsUsed") {
    orderBy = { license: { seatsUsed: order } };
  } else {
    orderBy = { [sort]: order } as Prisma.CompanyOrderByWithRelationInput;
  }

  const [items, total] = await prisma.$transaction([
    prisma.company.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
      include: {
        license: true,
        _count: { select: { users: true, invites: true } },
      },
    }),
    prisma.company.count({ where }),
  ]);

  const rows: CompanyRow[] = items.map((c) => {
    const createdAtISO = c.createdAt.toISOString();
    const updatedAtISO = c.updatedAt.toISOString();
    const licenseExpiresAtISO = c.license?.expiresAt
      ? c.license.expiresAt.toISOString()
      : null;

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,

      createdAtISO,
      createdAtLabel: frShort.format(c.createdAt),

      updatedAtISO,
      updatedAtLabel: frShort.format(c.updatedAt),

      licenseStatus: c.license?.status ?? null,
      licenseSeats: c.license?.seats ?? null,
      licenseSeatsUsed: c.license?.seatsUsed ?? null,
      licenseExpiresAtISO,
      licenseExpiresAtLabel: licenseExpiresAtISO
        ? frShort.format(c.license!.expiresAt)
        : null,

      usersCount: c._count.users,
      invitesCount: c._count.invites,
    };
  });

  return { rows, total, page, perPage };
}