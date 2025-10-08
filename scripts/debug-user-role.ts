import prisma from "@/lib/prisma";

async function main() {
  const regular = await prisma.user.findUnique({ where: { id: "test-user-e2e-1" } });
  const admin = await prisma.user.findUnique({ where: { id: "test-admin-e2e-1" } });
  console.log("regular user:", regular);
  console.log("admin user:", admin);
}

main().finally(() => process.exit(0));
