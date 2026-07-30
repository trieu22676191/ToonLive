import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "./db.js";

describe("Prisma Client", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("inserts and queries a User", async () => {
    const email = `test-${Date.now()}@example.com`;

    const created = await prisma.user.create({ data: { email, password: "hashed-password" } });
    const found = await prisma.user.findUnique({ where: { id: created.id } });

    expect(found?.email).toBe(email);

    await prisma.user.delete({ where: { id: created.id } });
  });
});
