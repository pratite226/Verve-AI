const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PLANS = [
  {
    name: "Free",
    priceCents: 0,
    interval: "monthly",
    features: ["Brand Brief", "Content Studio", "3 drafts/month"],
  },
  {
    name: "Pro",
    priceCents: 1900,
    interval: "monthly",
    features: ["Everything in Free", "Unlimited drafts", "Weekly Planner", "Brand Canvas"],
  },
];

async function main() {
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }
  console.log(`Seeded ${PLANS.length} plans`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
