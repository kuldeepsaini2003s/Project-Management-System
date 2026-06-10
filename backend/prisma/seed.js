import bcrypt from "bcryptjs";
import prisma from "../src/config/db.js";

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "demo@linear.app" },
    update: {},
    create: {
      email: "demo@linear.app",
      name: "Demo User",
      password,
      provider: "EMAIL",
    },
  });

  console.log("Seeded demo@linear.app / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
