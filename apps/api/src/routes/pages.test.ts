import "dotenv/config";
import { prisma } from "@comic-to-voice/shared";
import FormData from "form-data";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

describe("POST /comics/:comicId/pages", () => {
  const app = buildApp();
  let userId: string;
  let comicId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email: `pages-test-${Date.now()}@example.com`, password: "hashed-password" },
    });
    userId = user.id;
    const comic = await prisma.comic.create({
      data: { userId, title: "Test Comic" },
    });
    comicId = comic.id;
  });

  afterAll(async () => {
    await prisma.page.deleteMany({ where: { comicId } });
    await prisma.comic.delete({ where: { id: comicId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("uploads an image and creates a Page record", async () => {
    const form = new FormData();
    form.append("file", ONE_PIXEL_PNG, { filename: "page1.png", contentType: "image/png" });
    form.append("pageNumber", "1");

    const response = await app.inject({
      method: "POST",
      url: `/comics/${comicId}/pages`,
      payload: form.getBuffer(),
      headers: form.getHeaders(),
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.comicId).toBe(comicId);
    expect(body.pageNumber).toBe(1);
    expect(body.imageUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
  });
});
