import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [],
  errorFormat: "pretty",
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
