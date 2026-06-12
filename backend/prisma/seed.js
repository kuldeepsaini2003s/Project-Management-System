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

  const existing = await prisma.membership.findFirst({ where: { userId: user.id } });
  if (existing) {
    console.log("Demo data already present.");
    return;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: "Algofolks",
      memberships: { create: { userId: user.id, role: "OWNER" } },
      teams: {
        create: {
          name: "Algofolks",
          key: "ALG",
          icon: "⚡",
          color: "#5e6ad2",
        },
      },
    },
    include: { teams: true },
  });

  const team = workspace.teams[0];

  await prisma.project.create({
    data: {
      teamId: team.id,
      name: "Mobile App",
      icon: "📱",
      color: "#5e6ad2",
      status: "IN_PROGRESS",
      priority: "HIGH",
      leadId: user.id,
    },
  });

  await prisma.issue.create({
    data: {
      teamId: team.id,
      number: 1,
      title: "Set up CI pipeline",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: user.id,
    },
  });
  await prisma.team.update({ where: { id: team.id }, data: { issueCounter: 1 } });

  console.log("Seeded demo@linear.app / password123 with workspace + team.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
