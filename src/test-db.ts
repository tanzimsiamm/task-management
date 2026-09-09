import prisma from "./lib/prisma.js";

async function main() {
  const result = await prisma.$queryRaw<
    { current_database: string }[]
  >`SELECT current_database()`;

  console.log(result);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });