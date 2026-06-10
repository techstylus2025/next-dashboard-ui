import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  const id = 10;
  try {
    const a = await prisma.assignment.findUnique({ where: { id } });
    console.log("found", !!a, a);
    const updated = await prisma.assignment.update({
      where: { id },
      data: { isArchived: !(a?.isArchived ?? false) },
    });
    console.log("updated", updated);
  } catch (e) {
    console.error("error", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
