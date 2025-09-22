// scripts/seed-auth.ts
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

const BASE_URL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

type SeedUser = {
  email: string;
  name: string;
  platformRole?: "SUPER_ADMIN";
};

const USERS: SeedUser[] = [
  { email: "superadmin@exemple.com", name: "Super Admin", platformRole: "SUPER_ADMIN" },
  { email: "owner@acme.com",         name: "Acme Owner" },
  { email: "member@acme.com",        name: "Acme Member" },
];

const PASSWORD = "password123";

async function getBAUserId(email: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "public"."user" WHERE email = ${email} LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

async function signupIfMissing(u: SeedUser): Promise<string> {
  // 1) si déjà en BDD Better Auth → on retourne l'id
  const existingId = await getBAUserId(u.email);
  if (existingId) {
    console.log(`↩︎ BA déjà présent: ${u.email} (id=${existingId})`);
    return existingId;
  }

  // 2) sinon on tente le sign-up (name requis dans ton schéma BA)
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: u.name, email: u.email, password: PASSWORD }),
  });

  // 2a) succès (200/204) → récup id depuis le JSON ou la BDD
  if (res.ok) {
    let id: string | null = null;
    if (res.headers.get("content-type")?.includes("application/json")) {
      const data: any = await res.json().catch(() => null);
      id = data?.user?.id ?? null;
    }
    if (!id) id = await getBAUserId(u.email);
    if (!id) throw new Error(`Sign-up OK mais id introuvable pour ${u.email}`);
    console.log(`✓ BA sign-up: ${u.email} (id=${id})`);
    return id;
  }

  // 2b) déjà existant → Better Auth peut renvoyer 409 ou 422 selon versions/config
  if (res.status === 409) {
    const id = await getBAUserId(u.email);
    if (!id) throw new Error(`409 mais id introuvable pour ${u.email}`);
    console.log(`↩︎ BA existant (409): ${u.email} (id=${id})`);
    return id;
  }
  if (res.status === 422) {
    // ex: USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL (remonté sur GitHub)
    const json = await res.json().catch(() => null);
    const code = json?.code;
    if (code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
      const id = await getBAUserId(u.email);
      if (!id) throw new Error(`422 existant mais id introuvable pour ${u.email}`);
      console.log(`↩︎ BA existant (422:${code}): ${u.email} (id=${id})`);
      return id;
    }
    throw new Error(`422 ${JSON.stringify(json)}`);
  }

  // 2c) autre erreur → on affiche le body pour debug
  const text = await res.text().catch(() => "");
  throw new Error(`sign-up failed for ${u.email}: ${res.status} ${text}`);
}

async function main() {
  console.log("Seeding against", BASE_URL);

  // 1) Better Auth users (création si absent, sinon récupération)
  const authIds: Record<string, string> = {};
  for (const u of USERS) {
    authIds[u.email] = await signupIfMissing(u);
  }

  // 2) Domaine applicatif : AppUser (liés par authUserId)
  for (const u of USERS) {
    await prisma.appUser.upsert({
      where: { email: u.email },
      update: {
        authUserId: authIds[u.email],
        platformRole: u.platformRole ?? undefined,
      },
      create: {
        email: u.email,
        authUserId: authIds[u.email],
        platformRole: u.platformRole ?? undefined,
      },
    });
  }

  // 3) Entreprise + licence
  const company = await prisma.company.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      name: "Acme",
      slug: "acme",
      license: {
        create: {
          seats: 50,
          seatsUsed: 0,
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        },
      },
    },
  });

  // 4) Rôles
  const owner = await prisma.appUser.findUnique({ where: { email: "owner@acme.com" } });
  const member = await prisma.appUser.findUnique({ where: { email: "member@acme.com" } });

  if (owner) {
    await prisma.companyUser.upsert({
      where: { companyId_appUserId: { companyId: company.id, appUserId: owner.id } },
      update: { role: "OWNER" },
      create: { companyId: company.id, appUserId: owner.id, role: "OWNER" },
    });
  }
  if (member) {
    await prisma.companyUser.upsert({
      where: { companyId_appUserId: { companyId: company.id, appUserId: member.id } },
      update: { role: "MEMBER" },
      create: { companyId: company.id, appUserId: member.id, role: "MEMBER" },
    });
  }

  console.log("✅ Seed Better Auth + Prisma OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });