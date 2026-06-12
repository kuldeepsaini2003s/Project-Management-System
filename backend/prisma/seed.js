import bcrypt from "bcryptjs";
import prisma from "../src/config/db.js";

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@linear.app" },
    update: {},
    create: { email: "demo@linear.app", name: "Demo User", password, provider: "EMAIL" },
  });

  // Give the demo user a workspace with a couple of projects.
  const existing = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
  });

  if (!existing) {
    const workspace = await prisma.workspace.create({
      data: {
        name: "Algofolks",
        memberships: { create: { userId: user.id, role: "OWNER" } },
        projects: {
          create: [
            { name: "Mobile App", icon: "📱", color: "#5e6ad2", status: "IN_PROGRESS" },
            { name: "Website Redesign", icon: "🎨", color: "#26a269", status: "PLANNED" },
          ],
        },
      },
    });
    console.log("Created workspace:", workspace.name);
  }

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
