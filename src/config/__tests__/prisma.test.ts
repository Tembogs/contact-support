import prisma from "../prisma";

describe("Prisma Client", () => {
  it("connects to test DB", async () => {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1`;
    expect(result).toBeDefined();
  });
});
