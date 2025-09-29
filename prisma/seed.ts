import { PrismaClient } from "../lib/generated/prisma";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const prisma = new PrismaClient();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const superAdminEmail = "superadmin@exemple.com";
  const companyAdminEmail = "owner@acme.com";
  const memberEmail = "member@acme.com";

  // Hasher le password
  const passwordHash = await bcrypt.hash("password123", 10);

  const client = await pool.connect();
  try {
    // Super Admin
    await client.query(
      `INSERT INTO auth_user (id, email, password, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      ["user-superadmin", superAdminEmail, passwordHash]
    );

    // Owner entreprise
    await client.query(
      `INSERT INTO auth_user (id, email, password, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      ["user-owner", companyAdminEmail, passwordHash]
    );

    // Membre entreprise
    await client.query(
      `INSERT INTO auth_user (id, email, password, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      ["user-member", memberEmail, passwordHash]
    );
  } finally {
    client.release();
  }

  // Prisma pour tes tables applicatives
  const superAdmin = await prisma.user.upsert({
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

  const owner = await prisma.user.upsert({
    where: { email: companyAdminEmail },
    update: {},
    create: { email: companyAdminEmail },
  });

  const member = await prisma.user.upsert({
    where: { email: memberEmail },
    update: {},
    create: { email: memberEmail },
  });

  await prisma.companyUser.upsert({
    where: { companyId_userId: { companyId: company.id, userId: owner.id } },
    update: { role: "OWNER" },
    create: { companyId: company.id, userId: owner.id, role: "OWNER" },
  });

  await prisma.companyUser.upsert({
    where: { companyId_userId: { companyId: company.id, userId: member.id } },
    update: { role: "MEMBER" },
    create: { companyId: company.id, userId: member.id, role: "MEMBER" },
  });

  console.log("✅ Seed terminé");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });