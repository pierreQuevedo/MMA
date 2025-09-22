// scripts/seed-auth.ts
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();
const BASE_URL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

async function signup(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok || res.status === 204) {
    console.log(`✓ BA sign-up OK: ${email}`);
    return;
  }
  if (res.status === 409) {
    console.log(`↩︎ BA user déjà présent: ${email} (skip)`);
    return;
  }
  const text = await res.text().catch(() => "");
  throw new Error(`sign-up failed for ${email}: ${res.status} ${text}`);
}

async function main() {
  const superAdminEmail = "superadmin@exemple.com";
  const ownerEmail = "owner@acme.com";
  const memberEmail = "member@acme.com";
  const password = "password123";

  console.log("Seeding against", BASE_URL);

  // 1) Comptes Better Auth
  await signup(superAdminEmail, password);
  await signup(ownerEmail, password);
  await signup(memberEmail, password);

  // 2) Domaine Prisma (AppUser + Company + CompanyUser)
  await prisma.appUser.upsert({
    where: { email: superAdminEmail },
    update: { platformRole: "SUPER_ADMIN" },
    create: { email: superAdminEmail, platformRole: "SUPER_ADMIN" },
  });

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

  const owner = await prisma.appUser.upsert({
    where: { email: ownerEmail },
    update: {},
    create: { email: ownerEmail },
  });

  const member = await prisma.appUser.upsert({
    where: { email: memberEmail },
    update: {},
    create: { email: memberEmail },
  });

  await prisma.companyUser.upsert({
    where: { companyId_appUserId: { companyId: company.id, appUserId: owner.id } },
    update: { role: "OWNER" },
    create: { companyId: company.id, appUserId: owner.id, role: "OWNER" },
  });

  await prisma.companyUser.upsert({
    where: { companyId_appUserId: { companyId: company.id, appUserId: member.id } },
    update: { role: "MEMBER" },
    create: { companyId: company.id, appUserId: member.id, role: "MEMBER" },
  });

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